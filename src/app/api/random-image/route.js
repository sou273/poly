
import { NextResponse } from 'next/server';
import * as cheerio from 'cheerio';

export async function GET() {
  try {
    // 1. Get total number of posts
    const summaryResponse = await fetch(
      'https://www.irasutoya.com/feeds/posts/summary?max-results=0&alt=json',
      { next: { revalidate: 3600 } } // Cache for 1 hour
    );
    if (!summaryResponse.ok) throw new Error('Failed to fetch summary');
    const summaryData = await summaryResponse.json();
    const totalResults = parseInt(summaryData.feed.openSearch$totalResults.$t, 10);

    // 2. Generate random index (1-based for start-index)
    // Blogger API start-index is 1-based.
    const randomIndex = Math.floor(Math.random() * totalResults) + 1;

    // 3. Fetch the specific post
    // Use 'default' feed to get full content, not just summary
    const postResponse = await fetch(
      `https://www.irasutoya.com/feeds/posts/default?start-index=${randomIndex}&max-results=1&alt=json`,
      { cache: 'no-store' }
    );
    if (!postResponse.ok) throw new Error('Failed to fetch post');
    const postData = await postResponse.json();

    const entry = postData.feed.entry?.[0];
    if (!entry) throw new Error('No entry found');

    const title = entry.title.$t;
    const content = entry.content ? entry.content.$t : (entry.summary ? entry.summary.$t : '');
    const link = entry.link.find((l) => l.rel === 'alternate')?.href;

    // 4. Parse content to extract image and description
    let imageUrl = null;

    // Try to get image from media$thumbnail first (reliable)
    if (entry.media$thumbnail && entry.media$thumbnail.url) {
      imageUrl = entry.media$thumbnail.url;
      // Convert thumbnail size to large size (e.g. s72-c to s800)
      // Standard blogger thumbnail often looks like: .../s72-c/...
      // We want to replace the size segment with /s800/
      imageUrl = imageUrl.replace(/\/s[0-9]+(-c)?\//, '/s800/');
    }

    const $ = cheerio.load(content);

    // Fallback to scraping if no thumbnail
    if (!imageUrl) {
      imageUrl = $('img').first().attr('src');
    }

    if (imageUrl) {
      if (imageUrl.startsWith('//')) imageUrl = 'https:' + imageUrl;
    }

    // Description extraction
    // Irasutoya descriptions are often simple text.
    // We remove the title if it appears in text, and remove "公開日" etc.
    let description = $.text().trim();
    // Simple heuristic: Take the first substantial paragraph
    const firstParagraph = $('div.separator').next().text().trim() || description.split('\n')[0];
    if (firstParagraph && firstParagraph.length > 5) {
      description = firstParagraph;
    }

    return NextResponse.json({
      title,
      imageUrl,
      description,
      originalUrl: link
    });

  } catch (error) {
    console.error('Error fetching random image:', error);
    return NextResponse.json(
      { error: 'Failed to fetch random image' },
      { status: 500 }
    );
  }
}
