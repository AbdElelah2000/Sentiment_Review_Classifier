import React from 'react';

export const ReviewContext = React.createContext({
    reviews: [],
    setReviews: () => {},
    results: [],
    setResults: () => {},
  });
