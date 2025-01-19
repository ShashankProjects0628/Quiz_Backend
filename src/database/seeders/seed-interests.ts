import * as mongoose from 'mongoose';
import { InterestSchema } from '../models/interest.schema';

// MongoDB Connection URI
const mongoUri = 'mongodb://localhost:27017/quiz-app';

// Sample Interests Data
const sampleInterests = [
  { name: 'Technology' },
  { name: 'Science' },
  { name: 'Art' },
  { name: 'Music' },
  { name: 'Sports' },
  { name: 'Literature' },
  { name: 'Travel' },
  { name: 'Gaming' },
  { name: 'Food' },
  { name: 'Fitness' },
];

async function seedInterests() {
  console.log('Starting interests seeder...');

  try {
    // Connect to MongoDB
    await mongoose.connect(mongoUri);
    console.log('Connected to MongoDB.');

    // Initialize the Interest Model
    const Interest = mongoose.model('Interest', InterestSchema);

    // Check if the collection already has data
    const existingInterests = await Interest.find().exec();
    if (existingInterests.length > 0) {
      console.log('Interests data already exists. Skipping seeding.');
      return;
    }

    // Insert Sample Data
    await Interest.insertMany(sampleInterests);
    console.log('Successfully seeded interests data:', sampleInterests);
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
    console.log('MongoDB connection closed.');
  }
}

// Execute the seeder function
seedInterests();
