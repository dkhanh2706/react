const { test } = require("node:test");
const assert = require("node:assert/strict");
const bcrypt = require("bcrypt");

// Isolate the login response contract without connecting to a real database.
let account;
const databasePath = require.resolve("../config/database");
require.cache[databasePath] = {
  id: databasePath, filename: databasePath, loaded: true,
  exports: { query: async () => ({ rows: [account] }) },
};
process.env.JWT_SECRET = "avatar-regression-test-only";
const { login } = require("../controllers/auth.controller");

async function signIn(password = "AvatarPassword123") {
  const response = {
    statusCode: 200,
    status(code) { this.statusCode = code; return this; },
    json(data) { this.data = data; return this; },
  };
  await login({ body: { email: account.email, password } }, response);
  return response;
}

test("every fresh login returns the account avatar without exposing password hashes", async () => {
  account = {
    id: 12, email: "avatar@example.test", full_name: "Avatar Test", role: "CUSTOMER",
    password_hash: await bcrypt.hash("AvatarPassword123", 4),
    avatar_url: "/uploads/avatars/user-12-saved.png", token_version: 0,
  };
  const tokens = new Set();
  for (let session = 0; session < 2; session++) {
    const response = await signIn();
    assert.equal(response.statusCode, 200);
    assert.equal(response.data.user.avatar_url, account.avatar_url);
    assert.equal(response.data.user.id, account.id);
    assert.equal(response.data.user.password_hash, undefined);
    assert.ok(response.data.token);
    tokens.add(response.data.token);
  }
  assert.equal(tokens.size, 2, 'Each login has a distinct session, even within the same second');
  account = { ...account, id: 13, avatar_url: null };
  assert.equal((await signIn()).data.user.avatar_url, null);
  const invalid = await signIn("WrongPassword123");
  assert.equal(invalid.statusCode, 400);
  assert.equal(invalid.data.user, undefined);
});
