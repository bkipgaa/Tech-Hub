import React, { useState } from 'react';
import { Search as SearchIcon } from 'lucide-react';

const Search = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [results, setResults] = useState([]);

  const handleSearch = (e) => {
    e.preventDefault();
    // Simulate search results
    const mockResults = [
      { id: 1, title: "Web Development Service", category: "Services", price: "$999" },
      { id: 2, title: "UI/UX Design Package", category: "Services", price: "$799" },
      { id: 3, title: "Digital Marketing Campaign", category: "Services", price: "$599" },
    ].filter(item => 
      item.title.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setResults(mockResults);
  };

  return (
    <div className="py-12 max-w-4xl mx-auto">
      <h1 className="text-4xl font-bold text-red-600 mb-8 text-center">Search Services</h1>
      
      <form onSubmit={handleSearch} className="mb-8">
        <div className="flex gap-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search for services..."
            className="flex-1 p-4 border-2 border-green-300 rounded-lg focus:border-red-500 focus:outline-none text-lg"
          />
          <button
            type="submit"
            className="bg-gradient-to-r from-green-600 to-red-600 text-white px-8 py-4 rounded-lg hover:from-green-700 hover:to-red-700 flex items-center gap-2"
          >
            <SearchIcon className="w-5 h-5" />
            Search
          </button>
        </div>
      </form>

      {results.length > 0 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-semibold text-green-700 mb-4">Search Results</h2>
          {results.map(result => (
            <div key={result.id} className="bg-white p-6 rounded-lg shadow-md border-l-4 border-red-500">
              <h3 className="text-xl font-bold text-green-700">{result.title}</h3>
              <p className="text-gray-600">Category: {result.category}</p>
              <p className="text-red-600 font-semibold">Price: {result.price}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Search;