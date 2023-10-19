function estimateReadingTime(body) {
  // Define the average reading speed in words per minute
  const wordsPerMinute = 200; // You can adjust this value based on your content and target audience

  // Calculate the number of words in the body
  const wordCount = body.split(/\s+/).length;

  // Calculate the reading time in minutes
  const minutes = Math.ceil(wordCount / wordsPerMinute);

  // Calculate the reading time in seconds
  const seconds = minutes * 60;

  // Convert the seconds to a Date object
  const readingTime = new Date(0);
  readingTime.setSeconds(seconds);

  return readingTime;
}


module.exports = estimateReadingTime;