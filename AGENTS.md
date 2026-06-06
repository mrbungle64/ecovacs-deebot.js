# Agent Rules & Context

## Project Overview

`ecovacs-deebot` is a Node.js library for controlling Ecovacs Deebot vacuum cleaner robots. It handles API communication (MQTT/JSON), device state management, and map data processing.

## Workspace Configuration

This project uses a VS Code Multi-Root Workspace:
- **App-Code**: Located in the current git root (`.`).
- **Docs**: Located in the sibling directory (`../docs/ecovacs-deebot` or the workspace folder named "Docs").

## General Guidelines for the Agent

- **Always Consult Documentation First**: Before implementing, refactoring, or discussing any business logic or domain models, you MUST search and review the markdown files in the "Docs" workspace folder.
- **Source of Truth**: The external documentation is the absolute source of truth for business rules. If the existing code contradicts the documentation, flag the issue and prioritize the documentation's requirements.
- **Context Preservation**: Do not ignore files in the "Docs" folder just because they are outside the active Git repository.
- **Clean code**: Follow these guidelines to ensure your code is clean, maintainable, and adheres to best practices. Remember, less code is better. Lines of code = Debt.

## Key Mindsets

- **Simplicity**: Write simple and straightforward code.
- **Readability**: Ensure your code is easy to read and understand.
- **Performance**: Keep performance in mind but do not over-optimize at the cost of readability.
- **Maintainability**: Write code that is easy to maintain and update.
- **Testability**: Ensure your code is easy to test.
- **Reusability**: Write reusable components and functions.

## Code Guidelines

- **Utilize Early Returns**: Use early returns to avoid nested conditions and improve readability.
- **Descriptive Names**: Use descriptive names for variables and functions.
- **Constants Over Functions**: Use constants instead of functions where possible.
- **Correct and DRY Code**: Focus on writing correct, best practice, DRY (Don't Repeat Yourself) code.
- **Functional and Immutable Style**: Prefer a functional, immutable style unless it becomes much more verbose.
- **Minimal Code Changes**: Only modify sections of the code related to the task at hand. Avoid modifying unrelated pieces of code. Accomplish goals with minimal code changes.

## Comments and Documentation

* **Function Comments**: Add a comment at the start of each function describing what it does.
* **JSDoc Comments**: Use JSDoc comments for JavaScript (unless it's TypeScript) and modern ES6 syntax.

## Function Ordering

* Order functions with those that are composing other functions appearing earlier in the file. For example, if you have a menu with multiple buttons, define the menu function above the buttons.

## Handling Bugs

* **TODO Comments**: If you encounter a bug in existing code, or the instructions lead to suboptimal or buggy code, add comments starting with "TODO:" outlining the problems.

