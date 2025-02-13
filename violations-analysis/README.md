# Extract Metrics CLI

A command-line tool that extracts historical Packmind metrics from your codebase. This tool helps you track the evolution of Packmind rules and violations over time by analyzing git history and generating reports.

## Description

This tool performs the following operations:

1. For each month in the specified time range:
   - Finds the first commit of that month
   - Checks out that commit
   - Runs Packmind scan on the specified directory
   - Saves a temporary SARIF report as `packmind-YY-MM.json` (YY: two-digit year, MM: two-digit month)

2. After collecting all reports, it generates a consolidated CSV report (`packmind-history.csv`) that includes:
   - Rule IDs
   - Space Names
   - Rule Names
   - Rule Creation Dates
   - Monthly violation counts for each rule

3. Finally:
   - Cleans up all temporary JSON files
   - Restores the original git branch

## Requirements

- Node.js (v18 or higher)
- Git (repository with history)
- Access to the git repository with sufficient history
- Packmind CLI installed globally:
  ```bash
  npm install -g packmind-cli
  ```
## Usage

Before running the script, ensure your Packmind API key is set:
```bash
export PACKMIND_API_KEY=your_api_key
```

You must first **copy** the `packmind.js` file at the root of your Git project directory.


Then run the following command to extract the metrics:

```bash
cd <your_git_project_directory>
node packmind.js <number_of_months> <source_directory> [extra_arguments]
```

### Parameters

- `number_of_months`: Number of months to analyze (counting back from the current month)
- `source_directory`: Directory to scan with Packmind
- `extra_arguments` (optional): Additional arguments to pass to Packmind CLI

### Example

```bash
export PACKMIND_API_KEY=your_api_key
node dist/packmind.js 6 src "--spaces Packmind" 
```

This command will:
1. Analyze the last 6 months of history
2. Run Packmind scan on the `src` directory
3. Use the additional argument `--spaces Backend` to retrieve practices from the 'Backend' space
 
### Output Files

The script generates two types of files:

1. Temporary Monthly SARIF Reports:
   - Format: `packmind-YY-MM.json`
   - Contains detailed Packmind scan results for each month
   - Located in the root directory
   - Automatically deleted after the CSV report is generated

2. Final Consolidated CSV Report:
   - Filename: `packmind-history.csv`
   - Contains a matrix of rule violations across months
   - Includes rule metadata (ID, name, space, creation date)
   - Located in the root directory
   - This is the only file that remains after execution

## CSV Report Format

The generated CSV report contains the following columns:

- `Rule Id`: Unique identifier of the Packmind rule
- `Space Name`: The space the rule belongs to
- `Rule Name`: Human-readable name of the rule
- `Rule Creation`: Timestamp when the rule was created
- Monthly columns (YY-MM): Number of violations for each month
  - `-1`: Rule didn't exist at this time
  - `0`: No violations
  - `n`: Number of violations found

## Notes

- The script automatically restores your original git branch after completion
- Make sure you have no uncommitted changes before running the script
- The script requires write permissions in the current directory for output files
- All intermediate JSON files are automatically cleaned up after execution

## Troubleshooting

If you encounter issues:

1. Ensure Packmind CLI is properly installed and configured
2. Verify you have sufficient git history for the requested time range
3. Check write permissions in the current directory
4. Make sure all dependencies are properly installed
5. Verify your git repository is in a clean state
6. Contact support@packmind.com for any 
assistance
