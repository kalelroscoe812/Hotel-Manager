# Changelog
## [0.3.0] - 2026-10-20
### Added
- React and TypeScript frontend using Vite and Tailwind CSS.
- Role-based dashboards for administrators, front desk staff, property managers, and maintenance engineers.
- Hotel creation, editing, and management interface.
- Room inventory tracking and room status management.
- Electricity meter monitoring and maintenance features.
- Interactive API console for testing endpoints.

## [0.2.0] - 2026-10-13
### Added
- `GET /hotels/{hotel_id}` endpoint for retrieving individual hotels.
- `PUT /hotels/{hotel_id}` endpoint for updating hotel information.
- `DELETE /hotels/{hotel_id}` endpoint for deleting hotels.
- CRUD API endpoints for room management.
- User management and hotel staff assignments.
- Login endpoint and role-based user models.
- Additional database models for users, rooms, and electricity meters.
- Expanded API and service testing.
  
## [0.1.0] - 2026-09-28

### Included

- FastAPI hotel management API.
- `POST /hotels` endpoint for creating hotel records.
- `GET /hotels` endpoint for listing hotel records.
- PostgreSQL database integration through SQLAlchemy.
- Environment-based database configuration using `DATABASE_URL`.
- Unit tests for the hotel service layer.
- Integration test for the hotel API endpoints.
- Swagger API documentation through FastAPI.
