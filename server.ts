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

// Initialize Database
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

// Migration: Ensure columns exist
const tableInfo = db.prepare("PRAGMA table_info(products)").all() as any[];
const columns = tableInfo.map(c => c.name);
['category_id', 'sizes', 'colors', 'description', 'brand', 'is_preorder'].forEach(col => {
  if (!columns.includes(col)) {
    try { db.exec(`ALTER TABLE products ADD COLUMN ${col} ${col === 'is_preorder' ? 'INTEGER DEFAULT 0' : 'TEXT'}`); } catch(e) {}
  }
});

const catTableInfo = db.prepare("PRAGMA table_info(categories)").all() as any[];
const catColumns = catTableInfo.map(c => c.name);
if (!catColumns.includes('is_hidden')) {
  try { db.exec("ALTER TABLE categories ADD COLUMN is_hidden INTEGER DEFAULT 0"); } catch(e) {}
}

async function startServer() {
  const app = express();
  // Image আপলোডের জন্য লিমিট বাড়িয়ে ৫০এমবি করা হলো
  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // Auth Routes
  app.post("/api/auth/register", (req, res) => {
    const { name, email, phone, address, password } = req.body;
    try {
      const stmt = db.prepare("INSERT INTO users (name, email, phone, address, password) VALUES (?, ?, ?, ?, ?)");
      const info = stmt.run(name, email, phone, address, password);
      const user = db.prepare("SELECT id, name, email, role FROM users WHERE id = ?").get(info.lastInsertRowid);
      res.json(user);
    } catch (e) { res.status(400).json({ error: "Email already exists" }); }
  });

  app.post("/api/auth/login", (req, res) => {
    const { email, password } = req.body;
    const user = db.prepare("SELECT id, name, email, role, phone, address FROM users WHERE email = ? AND password = ?").get(email, password);
    if (user) res.json(user); else res.status(401).json({ error: "Invalid credentials" });
  });

  // Product Routes
  app.get("/api/products", (req, res) => {
    const products = db.prepare("SELECT p.*, c.name as category_name FROM products p LEFT JOIN categories c ON p.category_id = c.id ORDER BY p.created_at DESC").all();
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

  app.delete("/api/products/:id", (req, res) => {
    db.prepare("DELETE FROM products WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Category Routes
  app.get("/api/categories", (req, res) => {
    res.json(db.prepare("SELECT * FROM categories ORDER BY name").all());
  });

  app.post("/api/categories", (req, res) => {
    const info = db.prepare("INSERT INTO categories (name) VALUES (?)").run(req.body.name);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/categories/:id", (req, res) => {
    db.prepare("UPDATE categories SET name = ?, is_hidden = ? WHERE id = ?").run(req.body.name, req.body.is_hidden ? 1 : 0, req.params.id);
    res.json({ success: true });
  });

  // Hero Slides Routes
  app.get("/api/hero-slides", (req, res) => {
    res.json(db.prepare("SELECT * FROM hero_slides ORDER BY created_at DESC").all());
  });

  app.post("/api/hero-slides", (req, res) => {
    const { title, subtitle, discount, offer_text, image_url, link } = req.body;
    const stmt = db.prepare("INSERT INTO hero_slides (title, subtitle, discount, offer_text, image_url, link) VALUES (?, ?, ?, ?, ?, ?)");
    const info = stmt.run(title, subtitle, discount, offer_text, image_url, link);
    res.json({ id: info.lastInsertRowid });
  });

  app.put("/api/hero-slides/:id", (req, res) => {
    const { title, subtitle, discount, offer_text, image_url, link } = req.body;
    db.prepare("UPDATE hero_slides SET title = ?, subtitle = ?, discount = ?, offer_text = ?, image_url = ?, link = ? WHERE id = ?")
      .run(title, subtitle, discount, offer_text, image_url, link, req.params.id);
    res.json({ success: true });
  });

  app.delete("/api/hero-slides/:id", (req, res) => {
    db.prepare("DELETE FROM hero_slides WHERE id = ?").run(req.params.id);
    res.json({ success: true });
  });

  // Admin & Orders
  app.get("/api/admin/users", (req, res) => {
    res.json(db.prepare("SELECT id, name, email, role, phone, created_at FROM users ORDER BY created_at DESC").all());
  });

  app.put("/api/admin/users/:id/role", (req, res) => {
    db.prepare("UPDATE users SET role = ? WHERE id = ?").run(req.body.role, req.params.id);
    res.json({ success: true });
  });

  app.post("/api/orders", (req, res) => {
    const { customer_name, customer_email, customer_phone, address, total_amount, items, payment_method } = req.body;
    const info = db.prepare("INSERT INTO orders (customer_name, customer_email, customer_phone, address, total_amount, items, payment_method) VALUES (?, ?, ?, ?, ?, ?, ?)")
      .run(customer_name, customer_email, customer_phone, address, total_amount, JSON.stringify(items), payment_method);
    res.json({ id: info.lastInsertRowid });
  });

  app.get("/api/admin/orders", (req, res) => {
    res.json(db.prepare("SELECT * FROM orders ORDER BY created_at DESC").all());
  });

  app.put("/api/admin/orders/:id/status", (req, res) => {
    db.prepare("UPDATE orders SET status = ? WHERE id = ?").run(req.body.status, req.params.id);
    res.json({ success: true });
  });

  app.get("/api/admin/stats", (req, res) => {
    const totalSales = db.prepare("SELECT SUM(total_amount) as total FROM orders").get() as any;
    const orderCount = db.prepare("SELECT COUNT(*) as count FROM orders").get() as any;
    const productCount = db.prepare("SELECT COUNT(*) as count FROM products").get() as any;
    res.json({ totalSales: totalSales.total || 0, orderCount: orderCount.count, productCount: productCount.count });
  });

  app.get("/api/settings", (req, res) => {
    const settings = db.prepare("SELECT * FROM settings").all();
    res.json(settings.reduce((acc: any, s: any) => ({ ...acc, [s.key]: s.value }), {}));
  });

  app.post("/api/settings", (req, res) => {
    const upsert = db.prepare("INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)");
    db.transaction((data) => { for (const [k, v] of Object.entries(data)) upsert.run(k, v as string); })(req.body);
    res.json({ success: true });
  });

  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({ server: { middlewareMode: true }, appType: "spa" });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => res.sendFile(path.join(__dirname, "dist", "index.html")));
  }

  const PORT = process.env.PORT || 3000;
  app.listen(Number(PORT), "0.0.0.0", () => console.log(`Kin! Server running on port ${PORT}`));
}

startServer();
