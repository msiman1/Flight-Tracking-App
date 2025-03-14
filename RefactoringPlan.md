# Refactoring Plan for Flight Tracking Application

This document outlines the steps we will take to refactor the application according to best practices. The goal is to improve maintainability, readability, and structure.

## 1. Folder Structure and Organization

- **/components**: Presentational and container components (e.g., Dashboard, AircraftMap).
- **/hooks**: Custom hooks (e.g., useAircraftData).
- **/services**: API calls and business logic (e.g., aircraftApi functions).
- **/types**: TypeScript type definitions.
- **/utils**: Helper functions and common utilities.
- **/styles**: CSS and styling files.

## 2. Naming Conventions

- Use **PascalCase** for React component file names (e.g., Dashboard.tsx).
- Use **camelCase** for functions, variables, and custom hooks.
- Ensure file names match component names for clarity.

## 3. Refactor Custom Hooks

- **useAircraftData**: Separate API fetching logic, error handling, and state management clearly.
- Add explicit type annotations and validations for API responses.
- Move API logic to a dedicated service in the **/services** directory.

## 4. Component Refactoring

- **Presentational Components**: Should be "dumb" components that receive data via props. Avoid embedding business logic in these components.
- **Container Components / Hooks**: Manage all business logic and pass down clean, well-defined data to presentational components.
- Implement **conditional rendering** clearly: for instance, render the live map only when valid coordinates exist, and show the dashboard otherwise.

## 5. API and Service Enhancements

- Consolidate API calls in a single service file (e.g., `aircraftApi.ts`).
- Improve error handling and data validation.
- Consider using a library like Axios or a custom fetch wrapper for better API management.

## 6. Testing and Quality Assurance

- **Unit Tests**: Use Jest and React Testing Library to cover individual functions and components.
- **Integration Tests**: Verify that our components interact correctly, especially the conditional rendering aspects.
- Use ESLint and Prettier to ensure code quality and consistency.

## 7. Documentation

- Document components, hooks, and service functions using TSDoc/JSDoc.
- Maintain centralized documentation for overall project guidelines.

---

This refactoring plan will guide the systematic improvement of the project. The next steps include refactoring the custom hook (useAircraftData) and updating the UI components based on this structure. 