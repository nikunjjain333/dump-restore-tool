from fastapi import APIRouter, HTTPException
from app.services.docker_service import start_docker_daemon
import logging

logger = logging.getLogger(__name__)

router = APIRouter()

@router.post("/start")
def start_docker():
    """Check Docker daemon connectivity and return status"""
    try:
        result = start_docker_daemon()
        
        if result["success"]:
            logger.info(f"Docker operation successful: {result['message']}")
            return {
                "success": True,
                "message": result["message"],
                "status": result["status"]
            }
        else:
            logger.warning(f"Docker operation failed: {result['message']}")
            # Return 200 with error message instead of 500 for better UX
            return {
                "success": False,
                "message": result["message"],
                "status": result["status"]
            }
    except Exception as e:
        logger.error(f"Unexpected error in Docker start endpoint: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal server error: {str(e)}") 