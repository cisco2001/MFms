import axios from 'axios';

const API_BASE_URL = 'http://192.168.100.23:8000/api/';

export const submitLoanApplication = async (formData: FormData, token: string) => {
    try {
        const response = await axios.post(`${API_BASE_URL}loan-applications/`, formData, {
            headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'multipart/form-data', // Required for file uploads
            },
        });
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error('Error submitting loan application:', error);
        throw error;
    }
};

export const getExpenses = async (token: string) => {
    const response = await axios.get(`${API_BASE_URL}expenses/`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    console.log(response.data);
    return response.data;
};

export const addExpense = async (expense: any, token: string) => {
    const response = await axios.post(`${API_BASE_URL}expenses/`, expense, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const filterExpensesByDate = async (startDate: string, endDate: string, token: string) => {
    const response = await axios.get(`${API_BASE_URL}expenses/?start_date=${startDate}&end_date=${endDate}`, {
        headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
};

export const getCollections = async (token: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}loan-repayments/`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching collections:', error);
        throw error;
    }
};

export const addCollection = async (collection: any, token: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}loan-repayments/`, collection, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json', // Ensure the content type is set to JSON
        },
      });
      return response.data;
    } catch (error: any) {
      if (error.response) {
        console.error('Error response:', error.response.data);
        console.error('Error status:', error.response.status);
      }
      throw error;
    }
  };

// for customers
export const getCustomers = async (token: string) => {
    try {
        const response = await axios.get(`${API_BASE_URL}customers/`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        return response.data;
    } catch (error) {
        console.error('Error fetching customers:', error);
        throw error;
    }
};

export const getCustomerLoans = async (customerId: string, token: string) => {
    try {
        const response = await axios.get(
            `${API_BASE_URL}loan-applications/?customer=${customerId}&status=approved`,
            {
                headers: { Authorization: `Bearer ${token}` },
            }
        );
        console.log(response.data);
        return response.data;
    } catch (error) {
        console.error('Error fetching customer loans:', error);
        throw error;
    }
};

export const getLoanApplications = async (token: string, filters: { [key: string]: string } = {}) => {
    try {
      // Convert filters into query parameters
      const queryParams = new URLSearchParams(filters).toString();
  
      // Make the API request
      const response = await axios.get(`${API_BASE_URL}loan-applications/?${queryParams}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
  
      console.log("Loan applications fetched:", response.data); // Log the response for debugging
      return response.data;
    } catch (error) {
      console.error('Failed to fetch loan applications:', error);
      throw error;
    }
  };