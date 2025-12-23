const express = require('express');
const cors = require('cors');
const { sequelize } = require('./config/database');
const profileRoutes = require('./routes/profiles');

const app = express();
const PORT = process.env.PORT || 3000;


app.use(cors({
  origin: '*', 
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true
}));
app.use(express.json());


app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.path}`, req.body ? JSON.stringify(req.body).substring(0, 100) : '');
  next();
});


app.use('/api', profileRoutes);


app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'LinkedIn Automation Backend is running' });
});


const startServer = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connection established successfully.');
    
    await sequelize.sync({ alter: true });
    console.log('Database synchronized.');
    
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Unable to start server:', error);
    process.exit(1);
  }
};

startServer();
