import 'reflect-metadata';
import express from 'express';
import { DataSource } from 'typeorm';
import { User } from './entity/User';
import { Post } from './entity/Post';

const app = express();
app.use(express.json());

const AppDataSource = new DataSource({
  type: "mysql",
  host: process.env.DB_HOST || "localhost",
  port: 3306,
  username: process.env.DB_USER || "root",
  password: process.env.DB_PASSWORD || "password",
  database: process.env.DB_NAME || "test_db",
  entities: [User,Post],
  synchronize: true,
});

const wait = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const initializeDatabase = async () => {
  await wait(20000);
  try {
    await AppDataSource.initialize();
    console.log("Data Source has been initialized!");
  } catch (err) {
    console.error("Error during Data Source initialization:", err);
    process.exit(1);
  }
};

initializeDatabase();

app.post('/users', async (req, res) => {
  // Crie o endpoint de users

  const { firstName, lastName, email } = req.body;

  try {
    const userRepository = AppDataSource.getRepository(User);
    const userWithSameEmail = await userRepository.findOne({ where: { email: email } });

    if (userWithSameEmail) {
      return res.status(422).json({ error: 'Email is already in use' });
    }

    const user = new User();
    user.firstName = firstName;
    user.lastName = lastName;
    user.email = email;

    const savedUser = await userRepository.save(user);
    return res.status(201).json(savedUser);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error creating user' });
  }
});

app.post('/posts', async (req, res) => {
  // Crie o endpoint de posts

  const { title, description, userId } = req.body;

  try {
    const userRepository = AppDataSource.getRepository(User);
    const user = await userRepository.findOne({ where: { id: userId } });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const post = new Post();
    post.title = title;
    post.description = description;
    post.user = user;

    const savedPost = await AppDataSource.getRepository(Post).save(post);
    return res.status(201).json(savedPost);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: 'Error creating post' });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
