const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const jwt = require("jsonwebtoken");
const cookieParser = require('cookie-parser');
const { config } = require("dotenv");
const { User, Blog } = require("./models");
const estimateReadingTime = require("./utils")
const app = express();

config();
// app.use(cookieParser());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

mongoose.connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true });

// utilites
const respond = (res, status = 200, message, data = null) => {
    const successCodes = [200, 201,]

    return res.status(status).send({
        status: successCodes.includes(status) ? 'success' : 'error',
        message,
        data,
    })

}





// Middleware

const verifyAuthToken = async (req, res, next) => {
    try {
        const authorizationHeader = req.headers.authorization; // Get the "Authorization" header
        if (!authorizationHeader) return respond(res, 401, "Please Authenticate");

        // Extract the token part (remove "Bearer ")
        const token = authorizationHeader.split(' ')[1];

        // Check if it's valid
        if (!token) return respond(res, 401, "Please Authenticate");
        const decoded = jwt.verify(token, process.env.SECRET_KEY);
        if (!decoded) return respond(res, 401, "Please Authenticate");

        if (decoded?.type !== "auth") return respond(res, 401, "Please provide a valid token...");

        // Check if the user exists
        const user = await User.findOne({
            username: decoded.username,
        });

        if (!user) return respond(res, 404, "Sorry, but the user is not found!");
        req.user = user.toJSON();
        req.token = token;

        next();
    } catch (e) {
        // If something went wrong
        respond(res, 401, "Please Authenticate");
    }
};


// Utilities
function removeSpacesFromUsername(username) {
    // Use a regular expression to match and remove spaces
    const cleanedUsername = username.replace(/\s/g, '');
    return cleanedUsername;
}

// POST routes
app.post('/login', async (req, res) => {
    try {
        const { username, password } = req.body;
        const user = await User.findOne({ username });

        if (user && user.password === password) {
            const token = jwt.sign(
                { userId: user.id, username: user.username, type: "auth" },
                process.env.SECRET_KEY,
                { expiresIn: "1h" }
            );

            // Send the response here and return to exit the function
            return res.status(200).json({ message: "Successfully logged in", data: { ...user.toJSON(), token } });
        }

        // Send the response here and return to exit the function
        return res.status(401).json({ message: "Invalid credentials" });
    } catch (error) {
        console.error(error);
        // Send the response here and return to exit the function
        return res.status(500).json({ message: "Something went wrong, please try again later." });
    }
});



app.post('/register', async (req, res) => {
    try {
        const { first_name, last_name, username, password, confirmPassword } = req.body;
        const existingUser = await User.findOne({ username });

        if (existingUser) {
            return res.status(400).json({ message: "Username already exists" });
        }

        if (password !== confirmPassword) {
            return res.status(400).json({ message: "Passwords do not match" });
        }

        const user = new User({
            first_name,
            last_name,
            username: removeSpacesFromUsername(username),
            password
        });

        await user.save();
        res.status(200).json({ message: "Successfully registered", data: user.toJSON() });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Something went wrong, please try again later." });
    }
});

app.get('/user/blogs',verifyAuthToken, async (req, res) => {
    try {
      const { page = 1, limit = 20, state } = req.query;
      const skip = (page - 1) * limit;
  
      const query = Blog.find({ author: req.user?._id });
  
      if (state) {
        query.where('state').equals(state);
      }
  
      const totalCount = await Blog.countDocuments(query);
      const blogs = await query.skip(skip).limit(parseInt(limit));
  
      res.status(200).json({
        message: "User's blogs fetched successfully",
        data: blogs,
        total: totalCount,
        page: parseInt(page),
        limit: parseInt(limit),
      });
    } catch (error) {
      console.error(error);
      return respond(res, 500, "Something went wrong");
    }
  });


app.get('/', async (req, res) => {
    try {
        const { page = 1, limit = 20, author, title, tags, orderBy } = req.query;
        const skip = (page - 1) * limit;

        const query = Blog.find({ state: 'published' });

        if (author) {
            query.where('author').equals(author);
        }
        if (title) {
            query.where('title').regex(new RegExp(title, 'i'));
        }
        if (tags) {
            query.where('tags').in(tags);
        }

        if (orderBy) {
            query.sort(orderBy);
        }

        const totalCount = await Blog.countDocuments(query);
        const blogs = await query.skip(skip).limit(parseInt(limit)).populate('author');

        res.status(200).json({
            message: "Blogs fetched successfully",
            data: blogs,
            total: totalCount,
            page: parseInt(page),
            limit: parseInt(limit),
        });
    } catch (error) {
        console.error(error);
        return respond(res, 500, "Something went wrong", error);
    }
});

app.get('/blogs/:blogId', async (req, res) => {
    const { blogId } = req.params;

    try {
        // Find the blog by ID and populate the 'author' field to include user information
        const blog = await Blog.findById(blogId).populate('author');

        if (!blog) {
            return respond(res, 404, "Blog not found");
        }

        // Update the read_count by 1
        blog.read_count += 1;
        await blog.save();

        res.status(200).json({ message: "Blog fetched successfully", data: blog });
    } catch (error) {
        console.error(error);
        return respond(res, 500, "Something went wrong");
    }
});

app.post('/upload-blog', verifyAuthToken, async (req, res) => {
    try {
        const newBlog = new Blog({ ...req.body, author: req.user, reading_time: estimateReadingTime(req.body?.body) });
        await newBlog.save();
        res.status(200).json({ message: "Added a new blog successfully", data: newBlog.toJSON() });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: "Something went wrong, please try again later." });
    }
});
app.put('/edit-blog/:taskId', verifyAuthToken, async (req, res) => {
    const blogId = req.params.blogId;


    try {
        const blog = await Blog.find({ _id: blogId })
        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        const edittedblog = await Blog.edit(blogId);

        res.status(200).json({ message: 'Task updated successfully', data: task.toJSON() });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
});
app.put('/publish-blog/:blogId', verifyAuthToken, async (req, res) => {
    const blogId = req.params.blogId;

    try {
        const blog = await Blog.find({ _id: blogId })

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        const pBlog = await Blog.publish(blogId);
        res.status(200).json({ message: 'Blog published successfully', data: pBlog.toJSON() });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
});
app.put('/unpublish-blog/:blogId', verifyAuthToken, async (req, res) => {
    const blogId = req.params.blogId;

    try {
        const blog = await Blog.find({ _id: blogId })

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }
        const uBlog = await Blog.unpublish(blogId);
        res.status(200).json({ message: 'Blog published successfully', data: uBlog.toJSON() });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
});
app.delete('/delete-blog/:blogId', verifyAuthToken, async (req, res) => {
    const blogId = req.params.blogId;

    try {
        const blog = await Blog.findOne({ _id: blogId, user: req.user });

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Delete the blog from the database (optional)
        await Blog.findOneAndDelete({ _id: blogId, author: req.user });
        res.status(200).json({ message: 'Blog deleted successfully', data: Blog.toJSON() });
    } catch (err) {
        console.error(err);
        res.status(500).json({ message: 'Something went wrong, please try again later.' });
    }
});



// Handle errors globally.
app.use((err, req, res, next) => {
    // Log and handle errors.
    console.error(err);
    res.status(500).send('Something went wrong');
});

app.listen(process.env.PORT || 3000, () => {
    console.log('Server is running on port 3000');
});
module.exports = app;