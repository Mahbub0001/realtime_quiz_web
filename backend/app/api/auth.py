from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from app.database.db import get_db
from app.models.teacher import Teacher
from app.schemas.auth import TeacherCreate, TeacherLogin, TokenResponse, TeacherRead
from app.core.security import get_password_hash, verify_password, create_access_token
from app.core.config import settings
from jose import JWTError, jwt

router = APIRouter()
oauth2_scheme = OAuth2PasswordBearer(tokenUrl=f"{settings.API_V1_STR}/auth/login")

def get_current_teacher(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        teacher_id: str = payload.get("sub")
        if teacher_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    teacher = db.query(Teacher).filter(Teacher.id == int(teacher_id)).first()
    if teacher is None:
        raise credentials_exception
    return teacher

@router.post("/register", response_model=TeacherRead)
def register(teacher_in: TeacherCreate, db: Session = Depends(get_db)):
    teacher = db.query(Teacher).filter(Teacher.email == teacher_in.email).first()
    if teacher:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(teacher_in.password)
    db_teacher = Teacher(
        name=teacher_in.name,
        email=teacher_in.email, 
        hashed_password=hashed_password
    )
    db.add(db_teacher)
    db.commit()
    db.refresh(db_teacher)
    return db_teacher

@router.post("/login", response_model=TokenResponse)
def login(teacher_in: TeacherLogin, db: Session = Depends(get_db)):
    teacher = db.query(Teacher).filter(Teacher.email == teacher_in.email).first()
    if not teacher or not verify_password(teacher_in.password, teacher.hashed_password):
        raise HTTPException(status_code=401, detail="Incorrect email or password")
    
    access_token = create_access_token(subject=teacher.id)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=TeacherRead)
def read_teachers_me(current_teacher: Teacher = Depends(get_current_teacher)):
    return current_teacher
