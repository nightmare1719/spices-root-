import { describe, it, expect, beforeAll } from 'vitest';
import { db } from '../src/models/dataStore.js';
import { runSeed } from '../src/seed.js';
import { updateProductHandler } from '../src/controllers/productController.js';

beforeAll(async () => {
  await runSeed(true);
});

describe('Real-Time Product Synchronization & Anti-Reversion Guard', () => {
  it('successfully updates product image URL and details directly', async () => {
    const pepper = db.findProductById('prod_black_pepper');
    expect(pepper).toBeDefined();

    const newImageUrl = 'https://images.unsplash.com/photo-custom-pepper.jpg';
    let statusCode = 0;
    let jsonResult: any = null;

    const req: any = {
      params: { id: 'prod_black_pepper' },
      body: {
        images: [newImageUrl],
        shortDescription: 'Freshly harvested sun-cured peppercorns.'
      }
    };

    const res: any = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(payload: any) {
        jsonResult = payload;
        return this;
      }
    };

    await updateProductHandler(req, res);

    expect(jsonResult.success).toBe(true);
    expect(jsonResult.data.images[0]).toBe(newImageUrl);
    expect(jsonResult.data.shortDescription).toBe('Freshly harvested sun-cured peppercorns.');

    // Verify persisted in store
    const updatedInStore = db.findProductById('prod_black_pepper');
    expect(updatedInStore?.images[0]).toBe(newImageUrl);
  });

  it('handles invalid product IDs gracefully', async () => {
    let statusCode = 200;
    let jsonResult: any = null;

    const req: any = {
      params: { id: 'non_existent_id_999' },
      body: { name: 'Ghost Item' }
    };

    const res: any = {
      status(code: number) {
        statusCode = code;
        return this;
      },
      json(payload: any) {
        jsonResult = payload;
        return this;
      }
    };

    await updateProductHandler(req, res);
    expect(statusCode).toBe(404);
    expect(jsonResult.success).toBe(false);
  });

  it('correctly ingests external MongoDB change stream events via upsertProductFromMongo', () => {
    const mockMongoDoc = {
      id: 'prod_green_cardamom_8mm',
      _id: 'prod_green_cardamom_8mm',
      name: 'Alleppey Green Cardamom — 8mm Super Bold (Compass Edit)',
      images: ['https://images.unsplash.com/compass-cardamom-updated.jpg'],
      updatedAt: new Date().toISOString()
    };

    db.upsertProductFromMongo(mockMongoDoc);

    const updated = db.findProductById('prod_green_cardamom_8mm');
    expect(updated?.name).toBe('Alleppey Green Cardamom — 8mm Super Bold (Compass Edit)');
    expect(updated?.images[0]).toBe('https://images.unsplash.com/compass-cardamom-updated.jpg');
  });
});

