import { serve } from '@hono/node-server';
import { Hono } from 'hono';

const app = new Hono();

// Movie Storage
let movies: {
    id: string;
    title: string;
    director: string;
    releaseyear: number;
    genre: string;
    ratings: number[];
}[] = [];

// Add Movie Route
app.post('/addmovie', async (c) => {
    try {
        const { id, title, director, releaseyear, genre } = await c.req.json();

        // Check if movie with the same ID exists
        if (movies.find((movie) => movie.id === id)) {
            return c.json({ error: "Movie with this ID already exists" }, 400);
        }

        movies.push({ id, title, director, releaseyear, genre, ratings: [] });
        return c.json({ message: "Movie added successfully" });
    } catch (error) {
        return c.json({ error: "Invalid JSON format" }, 400);
    }
});

// Rate Movie Route
app.post('/ratemovie/:id', async (c) => {
    try {
        const id = c.req.param("id"); // Extract ID from route param
        const { rating } = await c.req.json();

        if (rating < 1 || rating > 5) {
            return c.json({ error: "Rating must be between 1 and 5" }, 400);
        }

        const movie = movies.find((m) => m.id === id);
        if (!movie) {
            return c.json({ error: "Movie not found" }, 404);
        }

        movie.ratings.push(rating);
        return c.json({ message: "Rating added successfully" });
    } catch (error) {
        return c.json({ error: "Invalid JSON format" }, 400);
    }
});
app.get('/getAverageRating/:id', (c) => {
    const id = c.req.param('id');
    const movie = movies.find((m) => m.id === id);
 if (!movie || movie.ratings.length === 0) {
        return c.json({ rating: 0 });
    }
    const sum = movie.ratings.reduce((a, b) => a + b, 0);
    const averageRating = (sum / movie.ratings.length).toFixed(2);
 return c.json({ rating: parseFloat(averageRating) });
});
app.get('/getTopRatedMovies', (c) => {
    const sortedMovies = [...movies].sort((a, b) => {
      const avgA = a.ratings.length ? a.ratings.reduce((x, y) => x + y, 0) / a.ratings.length : 0;
      const avgB = b.ratings.length ? b.ratings.reduce((x, y) => x + y, 0) / b.ratings.length : 0;
      return avgB - avgA;
    });
    return c.json({ movies: sortedMovies });
  });
  
  app.get('/getMoviesByGenre/:genre', (c) => {
    const genre = c.req.param('genre').toLowerCase();
    return c.json({ movies: movies.filter((m) => m.genre.toLowerCase() === genre) });
  });
  
  app.get('/getMoviesByDirector/:director', (c) => {
    const director = c.req.param('director').toLowerCase();
    return c.json({ movies: movies.filter((m) => m.director.toLowerCase() === director) });
  });
  
  app.get('/searchMovies/:keyword', (c) => {
    const keyword = c.req.param('keyword').toLowerCase();
    return c.json({ movies: movies.filter((m) => m.title.toLowerCase().includes(keyword)) });
  });
  
  app.get('/getMovie/:id', (c) => {
    const id = c.req.param('id');
    return c.json({ movie: movies.find((m) => m.id === id) });
  });
  
  app.delete('/removeMovie/:id', (c) => {
    const id = c.req.param('id');
    movies = movies.filter((movie) => movie.id !== id);
    return c.json({ message: "Movie removed successfully." });
  });
  


serve({
    fetch: app.fetch,
    port: 3000
  }, (info) => {
    console.log("Server is running on http://localhost:${info.port}")
  })




