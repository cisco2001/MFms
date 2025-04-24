import axios from 'axios';

const API_BASE_URL = 'http://192.168.0.34:8000/api/';


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

  export const getClientDetails = async (clientId: number, token: string) => {
    try {
      const response = await axios.get(`${API_BASE_URL}customers/${clientId}/`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching client details:', error);
      throw error;
    }
  };
  
  export const getLoanHistory = async (clientId: number, token: string) => {
    try {
      const [loanResponse, repaymentResponse] = await Promise.all([
        axios.get(`${API_BASE_URL}loan-applications/?customer=${clientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get(`${API_BASE_URL}loan-repayments/?customer=${clientId}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);
  
      const loanApplications = loanResponse.data.results || [];
      const repayments = repaymentResponse.data.results || [];
  
      const repaymentsByLoan = repayments.reduce((acc: { [key: string]: number }, repayment: any) => {
        const loanId = repayment.loan_application;
        acc[loanId] = (acc[loanId] || 0) + parseFloat(repayment.amount_paid);
        return acc;
      }, {});
  
      const loanHistoryWithRepayments = loanApplications.map((loan: any) => ({
        ...loan,
        amount_paid: repaymentsByLoan[loan.id] || 0,
        repayments: repayments.filter(
          (repayment: any) => repayment.loan_application === loan.id
        ),
      }));
  
      return loanHistoryWithRepayments;
    } catch (error) {
      console.error('Error fetching loan history:', error);
      throw error;
    }
  };

  export const getClients = async (token: string, query: string = '') => {
    try {
      const url = `${API_BASE_URL}customers/${query ? `?search=${query}` : ''}`;
      const response = await axios.get(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      
      // Get loan data for all clients 
      const clientsData = response.data.results || [];
      
      // For each client, fetch their loans and payments
      const clientsWithLoanData = await Promise.all(
        clientsData.map(async (client) => {
          try {
            // Fetch loan applications for this client
            const loanResponse = await axios.get(
              `${API_BASE_URL}loan-applications/?customer=${client.id}`, 
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            // Fetch repayments for this client
            const repaymentResponse = await axios.get(
              `${API_BASE_URL}loan-repayments/?customer=${client.id}`, 
              { headers: { Authorization: `Bearer ${token}` } }
            );
            
            const loans = loanResponse.data.results || [];
            const repayments = repaymentResponse.data.results || [];
            
            // Calculate total amounts
            let amount_loaned = 0;
            let amount_paid = 0;
            let due_date = null;
            let status = 'Paid';
            
            // Sum up all approved loans
            loans.forEach(loan => {
              if (loan.status === 'approved') {
                amount_loaned += parseFloat(loan.amount);
                
                // Get the latest due date
                if (loan.due_date) {
                  const loanDueDate = new Date(loan.due_date);
                  if (!due_date || loanDueDate > new Date(due_date)) {
                    due_date = loan.due_date;
                  }
                }
              }
            });
            
            // Sum up all repayments
            repayments.forEach(repayment => {
              amount_paid += parseFloat(repayment.amount_paid);
            });
            
            // Calculate amount owed
            const amount_owed = amount_loaned - amount_paid;
            
            // Determine status based on due date and amount owed
            if (amount_owed > 0) {
              if (due_date) {
                const today = new Date();
                const dueDate = new Date(due_date);
                
                if (dueDate < today) {
                  status = 'Overdue';
                } else {
                  status = 'Due';
                }
              } else {
                status = 'Due'; // If no due date but still owes money
              }
            }
            
            return {
              ...client,
              amount_loaned,
              amount_paid,
              amount_owed,
              due_date,
              status
            };
          } catch (error) {
            console.error(`Error fetching loan data for client ${client.id}:`, error);
            return {
              ...client,
              amount_loaned: 0,
              amount_paid: 0,
              amount_owed: 0,
              status: 'Unknown'
            };
          }
        })
      );
      
      return {
        ...response.data,
        results: clientsWithLoanData
      };
    } catch (error) {
      console.error('Error fetching clients:', error);
      throw error;
    }
  };
  
  export const registerClient = async (clientData: any, token: string) => {
    try {
      const response = await axios.post(`${API_BASE_URL}customers/`, clientData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error registering client:', error);
      throw error;
    }
  };

  // api.tsx

export const getLoanDetails = async (loanId: number, token: string) => {
  try {
      const response = await axios.get(`${API_BASE_URL}loan-applications/${loanId}/`, {
          headers: { Authorization: `Bearer ${token}` },
      });
      return response.data;
  } catch (error) {
      console.error('Error fetching loan details:', error);
      throw error;
  }
};
export const getLoanPayments = async (loanId: number, token: string) => {
  try {
    const response = await axios.get(`${API_BASE_URL}loan-repayments/?loan_application=${loanId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data.results || []; // Ensure this returns an array
  } catch (error) {
    console.error('Error fetching loan payments:', error);
    throw error;
  }
};