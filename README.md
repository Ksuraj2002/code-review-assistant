# code-review-assistant
This project focuses on building a seamless system that uses a large language model (LLM) to analyze source code and provide immediate, actionable feedback.


Objective: To automate the analysis of code structure, readability, and adherence to best practices.

LLM Prompt Documentation

1. System Prompt (Role Definition) : "You are a Senior Code Reviewer. Review this code for readability, modularity, and potential bugs, then provide improvement suggestions. Format the response strictly using Markdown."

2. User Prompt (Code Injection) : `Code to review (File: ${filename}):\n${fileContent}`


Core Functionality:

Input: User uploads a source code file  


Processing: A Node.js backend receives the file, extracts the content, and sends it to the Gemini LLM


Output: The LLM returns a detailed review report with improvement suggestions, which is then displayed to the user.
