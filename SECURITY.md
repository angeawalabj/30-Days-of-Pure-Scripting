# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |

## Reporting a Vulnerability

We take security seriously. If you discover a security vulnerability, please follow these steps:

### 1. Do Not Public Disclose

Please **do not** open a public GitHub issue for security vulnerabilities.

### 2. Report Privately

Send an email to: **security@30daysscripting.dev** (or your email)

Include:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Suggested fix (if any)

### 3. Response Timeline

- **24 hours**: Initial acknowledgment
- **7 days**: Detailed response with assessment
- **30 days**: Fix released (if confirmed)

### 4. Responsible Disclosure

We follow responsible disclosure:
- Fix vulnerability before public disclosure
- Credit reporter (if desired)
- Publish security advisory

## Security Best Practices

### For Contributors

1. **Never commit secrets**:
   - API keys
   - Passwords
   - Private keys
   - Tokens

2. **Validate all inputs**:
   ```javascript
   if (typeof input !== 'string') {
     throw new TypeError('Invalid input');
   }
   ```

3. **Use safe dependencies**:
   - This project uses **zero external dependencies**
   - Only Node.js built-in modules

4. **Sanitize user data**:
   ```javascript
   const clean = input.replace(/[<>]/g, '');
   ```

### For Users

1. **Keep Node.js updated**:
   ```bash
   node --version  # Should be ≥ 14.x
   ```

2. **Review code before running**:
   - This project is open source
   - Inspect code for suspicious activity

3. **Use in isolated environments**:
   - Test in containers/VMs if possible
   - Especially for file system operations

## Known Security Considerations

### File System Operations

Projects involving file system (Days 6, 8, 10, 19) should be used with caution:

```javascript
// Good: Validate paths
if (!filepath.startsWith('/safe/directory')) {
  throw new Error('Invalid path');
}

// Bad: Arbitrary file access
fs.readFile(userInput); // ❌ Dangerous!
```

### Network Operations

Projects with networking (Days 11-15) should implement:

- Input validation
- Rate limiting
- Timeout handling
- Error boundaries

### Cryptographic Operations

Projects using crypto (Days 16, 20) follow best practices:

- SHA-256 for hashing
- HMAC for signing
- No custom crypto algorithms

## Vulnerability Disclosure

Past vulnerabilities will be listed here (none currently).

## Security Hall of Fame

We recognize security researchers:

| Researcher | Vulnerability | Date | Severity |
|------------|---------------|------|----------|
| -          | -             | -    | -        |

## Contact

For security issues: security@30daysscripting.dev
For general issues: GitHub Issues

---

Last updated: March 2026