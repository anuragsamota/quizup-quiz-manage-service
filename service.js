// Quiz Service File

import express from 'express';
import morgan from 'morgan';
import cors from 'cors';
import { config } from 'dotenv';
import router from './router/route.js';
import connect from './database/conn.js';

config();

const app = express();

app.use(morgan('tiny'));
app.use(cors());
app.use(express.json());

const port = process.env.PORT || 8080;

app.use('/api/quiz', router);

app.get('/', (req, res) => {
    try {
        res.json({"serviceType":"quiz_manage","endpoint" : "/api"});
    } catch (error) {
        res.json(error)
    }
});

connect().then(() => {
    app.listen(port, () => {
        console.log(`Server connected to http://localhost:${port}`);
    });
}).catch(error => {
    console.log("Invalid Database Connection");
});