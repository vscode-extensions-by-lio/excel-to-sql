# Excel to SQL

A lightweight VS Code extension that converts tab-separated data copied from Excel into SQL `INSERT` statements.

Designed for quick testing and data seeding.

---

## Features

- Convert Excel copied data into SQL `INSERT` statements
- Support multiple tables in one input
- Detect `NULL` / `null` automatically
- Empty cells become empty strings (`''`)
- Generate SQL in a new editor tab
- Works directly from selected text (right-click menu)

---

## Usage

1. Copy data from Excel
2. Paste it into any file in VS Code
3. Select the pasted text
4. Right click → **Convert Excel to SQL**

The generated SQL will open in a new untitled editor.

---

## Supported Format

```text
tableName: students
data:
id	name	age
1	Tom	18
2	Jerry	null
```

## Multiple blocks are supported:
```text
tableName: students
data:
id	name	age
1	Tom	18

tableName: teachers
data:
id	name
1	Alice
```

## Rules
- tableName: defines the target table
- data: marks the start of tab-separated content
- First row after data: is treated as column names
- Following rows are treated as values
- null / NULL → SQL NULL
- Empty cells → empty string ('')
- Other values are inserted as quoted strings

## Example Output
```sql
INSERT INTO students (id, name, age) VALUES
('1', 'Tom', '18'),
('2', 'Jerry', NULL);
```

## Installation From VS Code Marketplace (coming soon) or manually:
`code --install-extension excel-to-sql.vsix`

## Development
```cmd
npm install
npm run compile
```