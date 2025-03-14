import { serve } from '@hono/node-server';
import { Hono } from 'hono';
const app = new Hono();
let movies: {
    id: string;
    title: string;
    director: string;
    releaseyear: number;
    genre: string;
    ratings: number[];
}[] = [];


app.post('/movies', async (c) => {
    try {
        const { id, title, director, releaseyear, genre } = await c.req.json();
        if (movies.find((movie) => movie.id === id)) {
            return c.json({ error: "Movie with this ID already exists" }, 400);
        }
         movies.push({ id, title, director, releaseyear, genre, ratings: [] });
        return c.json({ message: "Movie added successfully" });
    } catch (error) {
        return c.json({ error: "Invalid JSON format" }, 400);
    }
});


app.patch('/movies/:id', async (c) => {
  const id = c.req.param('id');
  const movie = movies.find((m) => m.id === id);
  if (!movie) return c.json({ error: "Movie not found" }, 404);
  const updates = await c.req.json();
  if (updates.title) movie.title = updates.title;
  if (updates.director) movie.director = updates.director;
  if (updates.releaseYear) movie.releaseyear = updates.releaseYear;
  if (updates.genre) movie.genre = updates.genre;

  return c.json({ message: "Movie updated successfully", movie });
});

app.get('/movies/:id',(c)=>{
  const movie=movies.find((m)=>m.id===c.req.param('id'));
  return movie?c.json(movie):c.json({error:"movie not found"});
});
app.delete('/movies/:id', (c) => {
  const id = c.req.param('id');
  const newMovies = movies.filter((m) => m.id !== id);
  
  if (newMovies.length === movies.length) {
      return c.json({ error: "Movie not found" }, 404);
  }
movies = newMovies; 
  return c.json({ message: "Movie removed successfully." });
});

app.post('/movies/:id/rating', async (c) => {
  try {
      const id = c.req.param('id');
      const { rating } = await c.req.json();

      if (!rating || rating < 1 || rating > 5) {
          return c.json({ error: "Rating must be between 1 and 5" }, 400);
      }
      const movie = movies.find((m) => m.id === id);
      if (!movie) return c.json({ error: "Movie not found" }, 404);
      if (!movie.ratings) {
          movie.ratings = [];
      }
       movie.ratings.push(rating);
      console.log(`Updated Movie Ratings:`, movie); 
      return c.json({ message: "Rating added successfully", movie });
  } catch (error) {
      return c.json({ error: "Invalid JSON format" }, 400);
  }
});
app.get('/movies/:id/rating', (c) => {
  const movie = movies.find((m) => m.id === c.req.param('id'));
  if (!movie) return c.json({ error: "Movie not found" }, 404);
  if (movie.ratings.length === 0) return c.json({ rating: 0 }, 404);
  const avgRating = movie.ratings.reduce((a, b) => a + b, 0) / movie.ratings.length;
  return c.json({ rating: avgRating.toFixed(2) });
});
app.get("/top-rated", (c) => {
  if (!movies?.length) {
    return c.json({ error: "No movies found" }, 404);
  }

  const sortedMovies = movies
    .filter((movie) => Array.isArray(movie.ratings) && movie.ratings.length > 0) 
    .map((movie) => {
      const total = movie.ratings.reduce((sum, r) => sum + 0);
      const avgRating = total / movie.ratings.length;
      return {
        id: movie.id,
        title: movie.title,
        avgRating,
        rating: movie.ratings,
      };
    })
    .sort((a, b) => b.avgRating - a.avgRating);

  return c.json(sortedMovies, 200);
});
app.get('/movies/genre/:genre', (c) => {
  const genre = c.req.param('genre').toLowerCase();
  const filteredMovies = movies.filter((m) => m.genre.toLowerCase() === genre);
  return filteredMovies.length ? c.json(filteredMovies) : c.json({ error: "No movies found" }, 404);
});
app.get('/movies/director/:director', (c) => {
  const director = c.req.param('director').toLowerCase();
  const filteredMovies = movies.filter((m) => m.director.toLowerCase() === director);
  return filteredMovies.length ? c.json(filteredMovies) : c.json({ error: "No movies found" }, 404);
});
app.get('/search/:keyword', (c) => {
  const keyword = c.req.param('keyword');
  if (!keyword) return c.json({ error: "Keyword query parameter is required" }, 400);

  const lowerKeyword = keyword.toLowerCase().trim();

  if (movies.length === 0) {
      console.log("No movies available in the database.");
      return c.json({ error: "No movies found" }, 404);
  }
  const filteredMovies = movies.filter((m) => {
      console.log(`Checking movie: ${m.title.toLowerCase()}`); 
      return m.title.toLowerCase().includes(lowerKeyword);
  });

  if (filteredMovies.length === 0) {
      console.log("No matching movies found."); 
      return c.json({ error: "No movies found" }, 404);
  }

  return c.json(filteredMovies);
});
serve({
    fetch: app.fetch,
    port: 3000
  }, (info) => {
    console.log("Server is running on http://localhost:${info.port}")
  })




