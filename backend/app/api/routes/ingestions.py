from fastapi import APIRouter, BackgroundTasks, HTTPException, status

from ...dependencies import CurrentUserDep, CurrentUser
from ...models.schemas import IngestionCreate, IngestionJob, ExtractedPlace
from ...repositories import ingestion_repo
from ...services.tiktok_extractor import is_tiktok_url
from ...jobs.ingestion_job import run_ingestion

router = APIRouter(prefix="/ingestions", tags=["ingestions"])


@router.post("", response_model=IngestionJob, status_code=status.HTTP_202_ACCEPTED)
def create_ingestion(
    body: IngestionCreate,
    background: BackgroundTasks,
    user: CurrentUser = CurrentUserDep,
):
    url = body.source_url.strip()
    if not is_tiktok_url(url):
        raise HTTPException(status.HTTP_400_BAD_REQUEST, "Only TikTok URLs are supported for MVP.")

    job = ingestion_repo.create_job(user.id, url)
    background.add_task(run_ingestion, job["id"], url)
    return IngestionJob(**job, extracted_places=[])


@router.get("/{job_id}", response_model=IngestionJob)
def get_ingestion(job_id: str, user: CurrentUser = CurrentUserDep):
    job = ingestion_repo.get_job(job_id, user.id)
    if not job:
        raise HTTPException(status.HTTP_404_NOT_FOUND, "Job not found")
    places = ingestion_repo.list_extracted(job_id)
    return IngestionJob(
        **job,
        extracted_places=[ExtractedPlace(**p) for p in places],
    )
