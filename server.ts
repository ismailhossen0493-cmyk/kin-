import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.resolve(__dirname, "kin.db");
let db: any;

try {
  db = new Database(dbPath);
} catch (err) {
  console.error("Failed to connect to database:", err);
  db = {
    prepare: () => ({ 
      get: () => null, 
      run: () => ({ lastInsertRowid: 0, changes: 0 }),
      all: () => []
    }),
    exec: () => {},
    transaction: (fn: any) => fn
  };
}

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user',
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS categories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    is_hidden INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    price REAL NOT NULL,
    category_id INTEGER,
    brand TEXT,
    stock INTEGER DEFAULT 0,
    image_url TEXT,
    sizes TEXT,
    colors TEXT,
    is_preorder INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(category_id) REFERENCES categories(id)
  );

  CREATE TABLE IF NOT EXISTS hero_slides (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    subtitle TEXT,
    discount TEXT,
    offer_text TEXT,
    image_url TEXT,
    link TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS orders (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    customer_name TEXT NOT NULL,
    customer_email TEXT NOT NULL,
    customer_phone TEXT NOT NULL,
    address TEXT NOT NULL,
    total_amount REAL NOT NULL,
    status TEXT DEFAULT 'Pending',
    items TEXT NOT NULL,
    payment_method TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT
  );
`);

const tableInfo = db.prepare("PRAGMA table_info(products)").all() as any[];
const columns = tableInfo.map(c => c.name);
if (!columns.includes('category_id')) {
  try { db.exec("ALTER TABLE products ADD COLUMN category_id INTEGER REFERENCES categories(id)"); } catch(e) {}
}
if (!columns.includes('sizes')) {
  try { db.exec("ALTER TABLE products ADD COLUMN sizes TEXT"); } catch(e) {}
}
if (!columns.includes('colors')) {
  try { db.exec("ALTER TABLE products ADD COLUMN colors TEXT"); } catch(e) {}
}
if (!columns.includes('description')) {
  try { db.exec("ALTER TABLE products ADD COLUMN description TEXT"); } catch(e) {}
}
if (!columns.includes('brand')) {
  try { db.exec("ALTER TABLE products ADD COLUMN brand TEXT"); } catch(e) {}
}
if (!columns.includes('is_preorder')) {
  try { db.exec("ALTER TABLE products ADD COLUMN is_preorder INTEGER DEFAULT 0"); } catch(e) {}
}

const catTableInfo = db.prepare("PRAGMA table_info(categories)").all() as any[];
const catColumns = catTableInfo.map(c => c.name);
if (!catColumns.includes('is_hidden')) {
  try { db.exec("ALTER TABLE categories ADD COLUMN is_hidden INTEGER DEFAULT 0"); } catch(e) {}
}

const categoryCount = db.prepare("SELECT COUNT(*) as count FROM categories").get() as { count: number };
if (categoryCount.count === 0) {
  const insertCat = db.prepare("INSERT INTO categories (name) VALUES (?)");
  ['Men', 'Women', 'Accessories', 'Heritage'].forEach(cat => insertCat.run(cat));
  db.prepare("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)").run('Admin', 'admin@kin.com.bd', 'admin123', 'admin');
  const insertSetting = db.prepare("INSERT INTO settings (key, value) VALUES (?, ?)");
  insertSetting.run('contact_phone', '01831990776');
  insertSetting.run('contact_email', 'concierge@kin.com.bd');
  insertSetting.run('footer_about', 'Crafting premium lifestyle experiences that celebrate the rich heritage of Bangladesh with a modern, global perspective.');
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '10mb' }));

  app.post("/api/auth/register", (req, res) => {
    const { name, email, phone, address, password } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO users (name, email, phone, address, password) VALUES (?, ?, ?, ?, ?)");
      const info = stmt.run(name, email, phone, address, password);
      const user = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(info.lastInsertRowid);
      res.json(user);
    } catch (e) {
      res.status(400).json({ error: "Email already exists" });
    }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT id, name, email, role, phone, address FROM users WHERE email = ? AND password = ?").get(email, password);
    if (user) {
      res.json(user);
    } else {
      res.status(401).json({ error: "Invalid credentials" });
    }
  });

  app.get("/api/products", (req, res) => {
    const products = db.prepare(`
      SELECT p.*, c.name as category_name, c.is_hidden as category_hidden
      FROM products p 
      LEFT JOIN categories c ON p.category_id = c.id 
      ORDER BY p.created_at DESC
    `).all();
    res.json(products);
  });

  app.post("/api/products", (req, res) => {
    const { name, price, category_id, brand, stock, image_url, description, sizes, colors, is_preorder } = req.body;
    const stmt = db.prepare("INSERT INTO products (name, price, category_id, brand, stock, image_url, description, sizes, colors, is_preorder) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
    const info = stmt.run(name, price, category_id, brand, stock, image_url, description, JSON.stringify(sizes), JSON.stringify(colors), is_preorder ? 1 : 0);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/products/:id", (req, res) => {
    const { name, price, category_id, brand, stock, image_url, description, sizes, colors, is_preorder } = req.body;
    const stmt = db.prepare("UPDATE products SET name = ?, price = ?, category_id = ?, brand = ?, stock = ?, image_url = ?, description = ?, sizes = ?, colors = ?, is_preorder = ? WHERE id = ?");
    stmt.run(name, price, category_id, brand, stock, image_url, description, JSON.stringify(sizes), JSON.stringify(colors), is_preorder ? 1 : 0, req.params.id);
    res.json({ success: true });
  });

  app.get("/api/categories", (req, res) => {
    const categories = db.prepare("SELECT * FROM categories ORDER BY name").all();
    res.json(categories);
  });

  app.put("/api/categories/:id", (req, res) => {
    const { name, is_hidden } = req.body;
    db.prepare("UPDATE categories SET name = ?, is_hidden = ? WHERE id = ?").run(name, is_hidden ? 1 : 0, req.params.id);
    res.json({ success: true });
  });

  app.get("/api/admin/users", (req, res) => {
    const users = db.prepare("SELECT id, name, email, role, phone, created_at FROM users ORDER BY created_at DESC").all();
    res.json(users);
  });

  app.put("/api/admin/users/:id/role", (req, res) => {
    const { role } = req.body;
    db.prepare("UPDATE users SET role = ? WHERE id = ?").run(role, req.params.id);
    res.json({ success: true });
  });

  app.post("/api/orders", (req, res) => {
    const { customer_name, customer_email, customer_phone, address, total_amount, items, payment_method } = req.body;
    const stmt = db.prepare(`
      INSERT INTO orders (customer_name, customer_email, customer_phone, address, total_amount, items, payment_method)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(customer_name, customer_email, customer_phone, address, total_amount, JSON.stringify(items), payment_method);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/admin/orders", (req, res) => {
    const orders = db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all();
    res.json(orders);
  });

  app.put("/api/admin/orders/:id/status", (req, res) => {
    const { status } = req.body;
    db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(status, req.params.id);
    res.json({ success: true });
  });

  app.get("/api/admin/stats", (req, res) => {
    const totalSales = db.prepare("SELECT SUM(total_amount) as total FROM orders").get() as { total: number };
    const orderCount = db.prepare("SELECT COUNT(*) as count FROM orders").get() as { count: number };
    const productCount = db.prepare("SELECT COUNT(*) as count FROM products").get() as { count: number };
    res.json({ totalSales: totalSales.total || 0, orderCount: orderCount.count, productCount: productCount.count });
  });

  app.get("/api/settings", (req, res) => {
    const settings = db.prepare("SELECT * FROM settings").all();
    const settingsMap = settings.reduce((acc: any, s: any) => {
      acc[s.key] = s.value;
      return acc;
    }, {});
    res.json(settingsMap);
  });

  app.post("/api/settings", (req, res) => {
    const settings = req.body;
    const upsert = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    const transaction = db.transaction((data) => {
      for (const [key, value] of Object.entries(data)) {
        upsert.run(key, value as string);
      }
    });
    transaction(settings);
    res.json({ success: true });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  const PORT = process.env.PORT || 3000;
  if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
    app.listen(Number(PORT), "0.0.0.0", () => {
      console.log(`Kin! Server running on http://localhost:${PORT}`);
    });
  }
  return app;
}

export default async (req: any, res: any) => {
  const app = await startServer();
  return app(req, res);
};

if (process.env.NODE_ENV !== "production" || !process.env.VERCEL) {
  startServer();
}
