import axios from 'axios';
import * as cheerio from 'cheerio';

export const scrapeJobPage = async (url: string) => {
  try {
    const { data } = await axios.get(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
      }
    });
    const $ = cheerio.load(data);
    
    // Remove scripts and styles
    $('script, style').remove();
    
    const bodyText = $('body').text().replace(/\s+/g, ' ').trim();
    return bodyText.substring(0, 10000); // Limit to 10k chars for Gemini
  } catch (error) {
    console.error('Scraping failed:', error);
    throw new Error('Could not fetch job page content');
  }
};
