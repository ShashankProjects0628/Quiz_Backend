import mongoose, { Types } from 'mongoose';
import { QuestionSchema } from '../models';

// MongoDB Connection URI
const mongoUri = 'mongodb://localhost:27017/quiz-app';

// Define the sample interests
const sampleInterests = [
  { name: 'Technology', _id: new Types.ObjectId() },
  { name: 'Science', _id: new Types.ObjectId() },
  { name: 'Art', _id: new Types.ObjectId() },
  { name: 'Music', _id: new Types.ObjectId() },
  { name: 'Sports', _id: new Types.ObjectId() },
  { name: 'Literature', _id: new Types.ObjectId() },
  { name: 'Travel', _id: new Types.ObjectId() },
  { name: 'Gaming', _id: new Types.ObjectId() },
  { name: 'Food', _id: new Types.ObjectId() },
  { name: 'Fitness', _id: new Types.ObjectId() },
];

// Define realistic questions for each interest
const interestQuestions = {
  Technology: {
    text: 'What does HTTP stand for?',
    choices: [
      { text: 'HyperText Transfer Protocol' },
      { text: 'Hyperlink Transfer Protocol' },
      { text: 'HyperText Translation Process' },
      { text: 'Hyperlink Translation Protocol' },
    ],
    correctIndex: 0,
  },
  Science: {
    text: 'What is the chemical symbol for water?',
    choices: [
      { text: 'H2O' },
      { text: 'HO2' },
      { text: 'O2H' },
      { text: 'OH2' },
    ],
    correctIndex: 0,
  },
  Art: {
    text: 'Who painted the "Mona Lisa"?',
    choices: [
      { text: 'Leonardo da Vinci' },
      { text: 'Vincent van Gogh' },
      { text: 'Pablo Picasso' },
      { text: 'Michelangelo' },
    ],
    correctIndex: 0,
  },
  Music: {
    text: 'Which instrument has 88 keys?',
    choices: [
      { text: 'Piano' },
      { text: 'Guitar' },
      { text: 'Violin' },
      { text: 'Saxophone' },
    ],
    correctIndex: 0,
  },
  Sports: {
    text: 'Which sport is known as "the beautiful game"?',
    choices: [
      { text: 'Football (Soccer)' },
      { text: 'Basketball' },
      { text: 'Cricket' },
      { text: 'Tennis' },
    ],
    correctIndex: 0,
  },
  Literature: {
    text: 'Who wrote "Pride and Prejudice"?',
    choices: [
      { text: 'Jane Austen' },
      { text: 'Emily Brontë' },
      { text: 'Charles Dickens' },
      { text: 'Mark Twain' },
    ],
    correctIndex: 0,
  },
  Travel: {
    text: 'Which city is known as "The Big Apple"?',
    choices: [
      { text: 'New York City' },
      { text: 'Los Angeles' },
      { text: 'Chicago' },
      { text: 'San Francisco' },
    ],
    correctIndex: 0,
  },
  Gaming: {
    text: 'In which game do players construct buildings and gather resources to survive?',
    choices: [
      { text: 'Minecraft' },
      { text: 'Fortnite' },
      { text: 'Call of Duty' },
      { text: 'Overwatch' },
    ],
    correctIndex: 0,
  },
  Food: {
    text: 'What is the main ingredient in guacamole?',
    choices: [
      { text: 'Avocado' },
      { text: 'Tomato' },
      { text: 'Lime' },
      { text: 'Cucumber' },
    ],
    correctIndex: 0,
  },
  Fitness: {
    text: 'Which exercise is primarily used to strengthen the chest muscles?',
    choices: [
      { text: 'Bench Press' },
      { text: 'Deadlift' },
      { text: 'Squat' },
      { text: 'Pull-Up' },
    ],
    correctIndex: 0,
  },
};

// Function to generate choices with ObjectIds
const generateChoicesWithIds = (
  choices: { text: string }[],
  correctIndex: number,
) => {
  return choices.map((choice, index) => ({
    _id: new Types.ObjectId(),
    text: choice.text,
    isCorrect: index === correctIndex, // Add correctness info for validation
  }));
};

// Function to generate sample questions
const generateSampleQuestions = (
  interests: { name: string; _id: Types.ObjectId }[],
) => {
  return interests.map((interest) => {
    const questionTemplate = interestQuestions[interest.name];
    const choicesWithIds = generateChoicesWithIds(
      questionTemplate.choices,
      questionTemplate.correctIndex,
    );

    return {
      text: questionTemplate.text,
      type: 'multiple-choice',
      choices: choicesWithIds,
      correctAnswer: choicesWithIds.find((c) => c.isCorrect)._id,
      tags: [interest._id],
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  });
};

async function seedQuestions() {
  try {
    // Connect to MongoDB
    await mongoose.connect(mongoUri);

    // Initialize the Interest Model
    const Question = mongoose.model('Question', QuestionSchema);

    // Check if the collection already has data
    const existingQuestions = await Question.find().exec();
    if (existingQuestions.length > 0) {
      return;
    }

    // Generate the payload
    const sampleQuestions = generateSampleQuestions(sampleInterests);

    // Insert Sample Data
    await Question.insertMany(sampleQuestions);
    console.log('Successfully seeded questions data:', sampleQuestions);
  } catch (error) {
    console.error('Error during seeding:', error);
  } finally {
    // Close the MongoDB connection
    await mongoose.connection.close();
  }
}

// Execute the seeder function
seedQuestions();
