// src/services/api.js

import axios from 'axios';

// Replace with your actual API Gateway URL
//export const API_BASE_URL = process.env.aws_lambda_base_url;
const API_BASE_URL = 'https://vm1x96ins8.execute-api.us-east-2.amazonaws.com/';

// Create a configured axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json'
  }
});

// API functions
//both comparisons and main can be one or more tickers separated by commas like AAPL,IBM,META
export const getCorrelations = async (main, comparisons) => {
  try {
    const response = await api.get(`/correlation?main=${main}&comparisons=${comparisons}`);
    return response.data;
  } catch (error) {
    console.error('Error fetching correlation:', error);
    throw error;
  }
};

export const getValidation = async (ticker) => {
    try {
      const response = await api.get(`/validate?ticker=${ticker}`);
      console.log("API Response:", response.data);
      return response.data.exists;

    } catch (error) {
      console.error('Error fetching correlation:', error);
      throw error;
    }
  };

export const getStockMetrics = async (ticker) => {
try {
    const response = await api.get(`/stockinfo?ticker=${ticker}`);
    console.log("API Response:", response.data);
    return response.data;

} catch (error) {
    console.error('Error fetching correlation:', error);
    throw error;
}
};