# Contributing to 30 Days of Pure Scripting

Thank you for your interest in contributing! This document outlines how to contribute effectively.

## 🎯 Philosophy

This project follows strict principles:
- ✅ **Zero dependencies**: Use only Node.js built-in modules
- ✅ **Test-driven**: All code must have tests (≥80% coverage)
- ✅ **Well-documented**: Clear README with examples
- ✅ **Production-ready**: Error handling, edge cases, performance

## 🚀 Getting Started

### Prerequisites

- Node.js ≥ 14.x
- npm or yarn
- Git

### Setup

```bash
# Fork the repository
git clone https://github.com/YOUR_USERNAME/30-days-scripting.git
cd 30-days-scripting

# Install dependencies (for testing only)
npm install

# Run tests
npm test
```

## 🔧 How to Contribute

### 1. Improve Existing Projects

You can contribute by:
- **Performance optimizations**
- **Better error handling**
- **Additional tests**
- **Documentation improvements**
- **Bug fixes**

### 2. Propose New Days

If you want to propose a new project (days 21-30):

1. **Follow the structure**:
   ```
   day-XX-project-name/
   ├── index.js       ← Main code
   ├── index.test.js  ← Tests (Jest)
   ├── package.json   ← Metadata
   └── README.md      ← Documentation
   ```

2. **Code standards**:
   ```javascript
   // ─── Configuration ───────────────────────────────
   const CONFIG = {...};

   // ─── Classes / Modules ───────────────────────────
   class MainClass {...}

   // ─── Helper Functions ────────────────────────────
   function helper() {...}

   // ─── CLI ─────────────────────────────────────────
   async function runCLI() {...}

   // ─── Exports ─────────────────────────────────────
   module.exports = {...};

   // ─── Entry Point ─────────────────────────────────
   if (require.main === module) {
     runCLI();
   }
   ```

3. **README template**:
   - 🎯 Problem
   - ⚡ Features
   - 🚀 Usage (CLI + API)
   - 🎯 Algorithms
   - 🏗️ Architecture
   - 📊 Performance
   - 🌟 Use Cases

4. **Tests required**:
   ```javascript
   describe('Module', () => {
     test('should work correctly', () => {
       expect(fn()).toBe(expected);
     });
   });
   ```

### 3. Report Bugs

Open an issue with:
- **Title**: Clear, descriptive
- **Description**: What happened vs. expected
- **Steps to reproduce**
- **Environment**: Node version, OS
- **Code sample**: Minimal reproducible example

### 4. Suggest Features

Open an issue with:
- **Use case**: Why is this needed?
- **Proposed solution**: How would it work?
- **Alternatives**: Other approaches considered

## 📝 Pull Request Process

### Before Submitting

1. **Create a branch**:
   ```bash
   git checkout -b feature/day-21-project
   ```

2. **Make changes**:
   - Follow coding standards
   - Add tests
   - Update documentation

3. **Test locally**:
   ```bash
   npm test
   ```

4. **Commit**:
   ```bash
   git commit -m "feat: add day 21 search engine"
   ```

   Commit message format:
   - `feat:` New feature
   - `fix:` Bug fix
   - `docs:` Documentation
   - `test:` Tests
   - `refactor:` Code refactoring
   - `perf:` Performance improvement

### Submitting PR

1. **Push to your fork**:
   ```bash
   git push origin feature/day-21-project
   ```

2. **Open Pull Request** on GitHub

3. **PR Description**:
   ```markdown
   ## What
   Brief description

   ## Why
   Reason for change

   ## How
   Implementation details

   ## Testing
   How to test this

   ## Checklist
   - [ ] Tests added/updated
   - [ ] Documentation updated
   - [ ] Zero dependencies maintained
   - [ ] Follows code standards
   ```

### Review Process

- Maintainers will review within 2-3 days
- Address feedback promptly
- Once approved, PR will be merged

## 🎨 Code Style

### JavaScript

- **Indentation**: 2 spaces
- **Quotes**: Single quotes `'`
- **Semicolons**: Always
- **Naming**:
  - `camelCase` for variables/functions
  - `PascalCase` for classes
  - `UPPER_CASE` for constants

### Comments

```javascript
/**
 * Detailed function description
 * @param {string} param - Description
 * @returns {Object} Description
 */
function example(param) {
  // Single-line comment for implementation detail
  return {};
}
```

## 🧪 Testing Guidelines

### Coverage

- Minimum 80% coverage
- Test all public APIs
- Include edge cases

### Test Structure

```javascript
describe('Feature', () => {
  // Setup
  beforeEach(() => {...});
  afterEach(() => {...});

  // Happy path
  test('should work correctly', () => {...});

  // Edge cases
  test('should handle empty input', () => {...});
  test('should throw on invalid input', () => {...});
});
```

## 📚 Documentation

### Code Comments

- Explain **why**, not **what**
- Document complexity (Big O)
- Reference algorithms/patterns used

### README

Required sections:
1. Problem description
2. Features list
3. Usage examples (CLI + API)
4. Algorithm explanation
5. Architecture diagram
6. Performance analysis
7. Real-world use cases

## ⚖️ License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Recognition

Contributors will be:
- Listed in CONTRIBUTORS.md
- Credited in release notes
- Mentioned in project documentation

## 💬 Questions?

- Open an issue for questions
- Tag with `question` label
- Join discussions

## 🎯 Current Priorities

Check [Issues](https://github.com/YOUR_USERNAME/30-days-scripting/issues) for:
- `good first issue` - Beginner-friendly
- `help wanted` - Community input needed
- `enhancement` - New features

---

Thank you for contributing to 30 Days of Pure Scripting! 🚀