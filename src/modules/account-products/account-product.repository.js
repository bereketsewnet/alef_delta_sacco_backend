import { query, execute } from '../../core/db.js';

export async function listAccountProducts() {
  const rows = await query('SELECT * FROM account_products ORDER BY category, name');
  return Array.isArray(rows) ? rows.map(row => ({
    product_code: row.product_code,
    name: row.name,
    description: row.description || null,
    category: row.category || null,
    is_active: Boolean(row.is_active),
    min_balance: Number(row.min_balance || 0),
    interest_rate: Number(row.interest_rate || 0),
    created_at: row.created_at,
    updated_at: row.updated_at
  })) : [];
}

export async function findAccountProductByCode(productCode) {
  const rows = await query('SELECT * FROM account_products WHERE product_code = ?', [productCode]);
  if (!Array.isArray(rows) || rows.length === 0) {
    return null;
  }
  const row = rows[0];
  return {
    product_code: row.product_code,
    name: row.name,
    description: row.description || null,
    category: row.category || null,
    is_active: Boolean(row.is_active),
    min_balance: Number(row.min_balance || 0),
    interest_rate: Number(row.interest_rate || 0),
    created_at: row.created_at,
    updated_at: row.updated_at
  };
}

export async function createAccountProduct(product) {
  await execute(
    `INSERT INTO account_products 
    (product_code, name, description, category, is_active, min_balance, interest_rate)
    VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      product.product_code,
      product.name,
      product.description || null,
      product.category || null,
      product.is_active !== undefined ? (product.is_active ? 1 : 0) : 1,
      product.min_balance || 0,
      product.interest_rate || 0
    ]
  );
  return findAccountProductByCode(product.product_code);
}

export async function updateAccountProduct(productCode, updates) {
  const fields = [];
  const values = [];
  
  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }
  if (updates.description !== undefined) {
    fields.push('description = ?');
    values.push(updates.description);
  }
  if (updates.category !== undefined) {
    fields.push('category = ?');
    values.push(updates.category);
  }
  if (updates.is_active !== undefined) {
    fields.push('is_active = ?');
    values.push(updates.is_active ? 1 : 0);
  }
  if (updates.min_balance !== undefined) {
    fields.push('min_balance = ?');
    values.push(updates.min_balance);
  }
  if (updates.interest_rate !== undefined) {
    fields.push('interest_rate = ?');
    values.push(updates.interest_rate);
  }
  
  if (fields.length === 0) {
    return findAccountProductByCode(productCode);
  }
  
  values.push(productCode);
  await execute(
    `UPDATE account_products SET ${fields.join(', ')}, updated_at = NOW() WHERE product_code = ?`,
    values
  );
  return findAccountProductByCode(productCode);
}

export async function deleteAccountProduct(productCode) {
  // Check if product is used in any accounts
  const usageRows = await query(
    'SELECT COUNT(*) as count FROM accounts WHERE product_code = ?',
    [productCode]
  );
  
  const usage = Array.isArray(usageRows) ? usageRows[0] : usageRows;
  const count = Number(usage?.count || 0);
  
  if (count > 0) {
    throw new Error(`Cannot delete account product: ${productCode} is used in ${count} account(s)`);
  }
  
  await execute('DELETE FROM account_products WHERE product_code = ?', [productCode]);
  return true;
}

