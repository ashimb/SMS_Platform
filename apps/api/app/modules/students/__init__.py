"""Students module: public surface."""

from app.modules.students.router import router
from app.modules.students.schemas import StudentOut
from app.modules.students.service import StudentService

__all__ = ["StudentOut", "StudentService", "router"]
