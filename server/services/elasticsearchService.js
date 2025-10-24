const { Client } = require('@elastic/elasticsearch');

class ElasticsearchService {
  constructor() {
    try {
      this.client = new Client({
        node: process.env.ELASTICSEARCH_URL || 'http://localhost:9200',
        requestTimeout: 30000,
        maxRetries: 3
      });
      this.indexName = 'emails';
      console.log('✅ Elasticsearch client initialized');
    } catch (error) {
      console.error('❌ Elasticsearch client initialization failed:', error);
      this.client = null;
    }
  }

  async init() {
    if (!this.client) {
      console.log('⚠️ Elasticsearch client not available, using memory fallback');
      return;
    }

    try {
      // Check if Elasticsearch is running
      const health = await this.client.cluster.health();
      console.log('🔍 Elasticsearch cluster status:', health.body.status);

      const exists = await this.client.indices.exists({ index: this.indexName });

      if (!exists.body) {
        await this.client.indices.create({
          index: this.indexName,
          body: {
            mappings: {
              properties: {
                messageId: { type: 'keyword' },
                account: { type: 'keyword' },
                from: {
                  properties: {
                    address: { type: 'keyword' },
                    name: { type: 'text' }
                  }
                },
                to: { type: 'object' },
                subject: {
                  type: 'text',
                  fields: {
                    keyword: { type: 'keyword' }
                  }
                },
                text: { type: 'text', analyzer: 'english' },
                html: { type: 'text' },
                date: { type: 'date' },
                category: { type: 'keyword' },
                labels: { type: 'keyword' },
                folder: { type: 'keyword' },
                threadId: { type: 'keyword' },
                hasAttachments: { type: 'boolean' }
              }
            }
          }
        });
        console.log('✅ Elasticsearch index created');
      } else {
        console.log('✅ Elasticsearch index already exists');
      }
    } catch (error) {
      console.error('❌ Error initializing Elasticsearch:', error.message);
      console.log('⚠️ Falling back to memory storage for search');
      this.client = null;
    }
  }

  async indexEmail(email) {
    if (!this.client) {
      console.log('⚠️ Elasticsearch not available, skipping indexing');
      return false;
    }

    try {
      await this.client.index({
        index: this.indexName,
        id: email.messageId,
        body: email,
        refresh: true
      });
      console.log(`✅ Email indexed: ${email.messageId}`);
      return true;
    } catch (error) {
      console.error('❌ Error indexing email:', error);
      return false;
    }
  }

  async searchEmails(query, filters = {}, from = 0, size = 50) {
    if (!this.client) {
      // Fallback to memory storage if Elasticsearch is not available
      const memoryStorage = require('./memoryStorageService');
      const result = memoryStorage.searchEmails(query, filters, Math.floor(from / size) + 1, size);
      return {
        emails: result.emails,
        total: result.total
      };
    }

    try {
      const mustClauses = [];

      if (query && query.trim() !== '') {
        mustClauses.push({
          multi_match: {
            query: query,
            fields: ['subject^3', 'text^2', 'from.name^2', 'from.address'],
            fuzziness: 'AUTO'
          }
        });
      }

      if (filters.account) {
        mustClauses.push({ term: { account: filters.account } });
      }

      if (filters.category) {
        mustClauses.push({ term: { category: filters.category } });
      }

      if (filters.folder) {
        mustClauses.push({ term: { folder: filters.folder } });
      }

      const searchBody = {
        query: {
          bool: {
            must: mustClauses.length > 0 ? mustClauses : [{ match_all: {} }]
          }
        },
        sort: [{ date: { order: 'desc' } }],
        from: from,
        size: size
      };

      const result = await this.client.search({
        index: this.indexName,
        body: searchBody
      });

      return {
        emails: result.body.hits.hits.map(hit => hit._source),
        total: result.body.hits.total.value
      };
    } catch (error) {
      console.error('❌ Error searching emails:', error);
      // Fallback to memory storage
      const memoryStorage = require('./memoryStorageService');
      const result = memoryStorage.searchEmails(query, filters, Math.floor(from / size) + 1, size);
      return {
        emails: result.emails,
        total: result.total
      };
    }
  }

  async updateEmailCategory(messageId, category) {
    if (!this.client) {
      console.log('⚠️ Elasticsearch not available, skipping category update');
      return false;
    }

    try {
      await this.client.update({
        index: this.indexName,
        id: messageId,
        body: {
          doc: { category }
        }
      });
      console.log(`✅ Email ${messageId} categorized as ${category}`);
      return true;
    } catch (error) {
      console.error('❌ Error updating email category:', error);
      return false;
    }
  }

  async getEmail(messageId) {
    if (!this.client) {
      // Fallback to memory storage
      const memoryStorage = require('./memoryStorageService');
      return memoryStorage.getEmail(messageId);
    }

    try {
      const result = await this.client.get({
        index: this.indexName,
        id: messageId
      });
      return result.body._source;
    } catch (error) {
      console.error('❌ Error getting email:', error);
      // Fallback to memory storage
      const memoryStorage = require('./memoryStorageService');
      return memoryStorage.getEmail(messageId);
    }
  }
}

module.exports = new ElasticsearchService();