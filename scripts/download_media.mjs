import https from 'https';
import fs from 'fs';
import path from 'path';

const downloads = [
  { url: 'https://images.unsplash.com/photo-1542361345-89ce58f62c02?w=1600&q=80', dest: 'public/media/hero-apartment.jpg' },
  { url: 'https://images.unsplash.com/photo-1577141517032-44161b9a117b?w=800&q=80', dest: 'public/media/cities/casablanca/casa-1.jpg' },
  { url: 'https://images.unsplash.com/photo-1583279149727-4b71191ec4d5?w=800&q=80', dest: 'public/media/cities/rabat/rabat-1.jpg' },
  { url: 'https://images.unsplash.com/photo-1539020140153-e479b8c22e70?w=800&q=80', dest: 'public/media/cities/marrakech/marrakech-1.jpg' },
  { url: 'https://images.unsplash.com/photo-1552087595-df720eb9fb4d?w=800&q=80', dest: 'public/media/cities/tanger/tanger-1.jpg' },
  { url: 'https://images.unsplash.com/photo-1549419131-419b48fcc1df?w=800&q=80', dest: 'public/media/cities/agadir/agadir-1.jpg' },
  { url: 'https://images.unsplash.com/photo-1563200062-8e7c10b25e1a?w=800&q=80', dest: 'public/media/cities/fes/fes-1.jpg' },
  { url: 'https://images.unsplash.com/photo-1627916524838-89c6d32155d3?w=800&q=80', dest: 'public/media/cities/meknes/meknes-1.jpg' },
  { url: 'https://images.unsplash.com/photo-1578335804593-51cc8f8303d7?w=800&q=80', dest: 'public/media/cities/oujda/oujda-1.jpg' },
  { url: 'https://images.unsplash.com/photo-1628186105307-da8636ba5916?w=800&q=80', dest: 'public/media/cities/tetouan/tetouan-1.jpg' },
  { url: 'https://images.unsplash.com/photo-1460317442991-0ec209397118?w=800&q=80', dest: 'public/media/cities/fallback.jpg' }
];

async function downloadImage({ url, dest }) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      // Handle redirects
      if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
        return downloadImage({ url: res.headers.location, dest }).then(resolve).catch(reject);
      }
      
      if (res.statusCode !== 200) {
        return reject(new Error(`Failed to get '${url}' (${res.statusCode})`));
      }

      const file = fs.createWriteStream(dest);
      res.pipe(file);
      file.on('finish', () => {
        file.close();
        console.log(`Downloaded: ${dest}`);
        resolve();
      });
      file.on('error', (err) => {
        fs.unlink(dest, () => reject(err));
      });
    }).on('error', reject);
  });
}

async function run() {
  for (const item of downloads) {
    try {
      await downloadImage(item);
    } catch (e) {
      console.error(e);
    }
  }
}

run();
