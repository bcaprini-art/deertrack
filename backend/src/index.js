import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRouter from './routes/auth.js';
import propertiesRouter from './routes/properties.js';
import sightingsRouter from './routes/sightings.js';

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));
app.use('/api/auth', authRouter);
app.use('/api/properties', propertiesRouter);
app.use('/api/sightings', sightingsRouter);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`DeerTrack API running on port ${PORT}`));
