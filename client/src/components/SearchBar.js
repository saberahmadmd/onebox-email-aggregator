import { Search, Filter } from 'lucide-react';
import { useState, useEffect } from 'react';
import { accountsAPI } from '../services/api';

const SearchBar = ({ filters, onFiltersChange, onSearch }) => {
  const [accounts, setAccounts] = useState([]);
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        const response = await accountsAPI.getAccounts();
        if (response.data.success) {
          setAccounts(response.data.data);
        }
      } catch (error) {
        console.error('Failed to load accounts:', error);
      }
    };
    loadAccounts();
  }, []);

  const handleInputChange = (field, value) => {
    onFiltersChange({
      ...filters,
      [field]: value
    });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch();
  };

  return (
    <div>
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Main search row */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="flex-1">
            {/*<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />*/}
            <input
              type="text"
              placeholder="Search in subjects and content..."
              className="input-field pl-10"
              value={filters.query}
              onChange={(e) => handleInputChange('query', e.target.value)}
            />
          </div>
          <button type="submit" className="btn-primary flex items-center space-x-2 sm:w-auto w-full justify-center">
            <Search className="h-4 w-4" />
            <span>Search</span>
          </button>
          <button
            type="button"
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center space-x-2 sm:hidden"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
        </div>

        {/* Filters */}
        <div className={`grid grid-cols-1 md:grid-cols-2 gap-4 ${showFilters ? 'block' : 'hidden md:grid'}`}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Account
            </label>
            <select
              className="input-field"
              value={filters.account}
              onChange={(e) => handleInputChange('account', e.target.value)}
            >
              <option value="">All Accounts</option>
              {accounts.map(account => (
                <option key={account.email} value={account.email}>
                  {account.email}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <select
              className="input-field"
              value={filters.category}
              onChange={(e) => handleInputChange('category', e.target.value)}
            >
              <option value="">All Categories</option>
              <option value="Interested">Interested</option>
              <option value="Meeting Booked">Meeting Booked</option>
              <option value="Not Interested">Not Interested</option>
              <option value="Spam">Spam</option>
              <option value="Out of Office">Out of Office</option>
            </select>
          </div>
        </div>
      </form>
    </div>
  );
};

export default SearchBar;