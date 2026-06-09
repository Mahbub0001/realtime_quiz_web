from app.database.db import SessionLocal, init_db
from app.models.teacher import Teacher
from app.models.quiz import Quiz, Question
from app.core.security import get_password_hash

def seed_data():
    init_db()
    db = SessionLocal()
    
    try:
        # Create teacher
        teacher = db.query(Teacher).filter(Teacher.email == "teacher@example.com").first()
        if not teacher:
            teacher = Teacher(
                name="Demo Teacher",
                email="teacher@example.com",
                hashed_password=get_password_hash("password123")
            )
            db.add(teacher)
            db.commit()
            db.refresh(teacher)

        # Create quiz
        quiz = db.query(Quiz).filter(Quiz.teacher_id == teacher.id).first()
        if not quiz:
            quiz = Quiz(
                title="Sample Educational Technology Quiz",
                description="A test quiz with various shapes and colors.",
                teacher_id=teacher.id
            )
            db.add(quiz)
            db.commit()
            db.refresh(quiz)

            # Add 5 questions
            questions = [
                Question(
                    quiz_id=quiz.id,
                    text="What does LMS stand for?",
                    shape="circle",
                    color="blue",
                    option_a="Learning Management System",
                    option_b="Local Machine Server",
                    option_c="Learning Method Software",
                    option_d="Lecture Management Service",
                    correct_option="A",
                    time_limit_seconds=20,
                    points=1000,
                    order_index=0
                ),
                Question(
                    quiz_id=quiz.id,
                    text="Which tool is typically used for version control?",
                    shape="square",
                    color="red",
                    option_a="Photoshop",
                    option_b="Git",
                    option_c="Word",
                    option_d="Excel",
                    correct_option="B",
                    time_limit_seconds=20,
                    points=1000,
                    order_index=1
                ),
                Question(
                    quiz_id=quiz.id,
                    text="What does CSS stand for?",
                    shape="triangle",
                    color="green",
                    option_a="Computer Style Sheets",
                    option_b="Creative Style System",
                    option_c="Cascading Style Sheets",
                    option_d="Colorful Style Sheets",
                    correct_option="C",
                    time_limit_seconds=20,
                    points=1000,
                    order_index=2
                ),
                Question(
                    quiz_id=quiz.id,
                    text="Which of these is a Python web framework?",
                    shape="diamond",
                    color="yellow",
                    option_a="React",
                    option_b="Angular",
                    option_c="Django",
                    option_d="Vue",
                    correct_option="C",
                    time_limit_seconds=20,
                    points=1000,
                    order_index=3
                ),
                Question(
                    quiz_id=quiz.id,
                    text="What is the primary language of the web?",
                    shape="circle",
                    color="purple",
                    option_a="Python",
                    option_b="C++",
                    option_c="Java",
                    option_d="JavaScript",
                    correct_option="D",
                    time_limit_seconds=20,
                    points=1000,
                    order_index=4
                )
            ]
            db.add_all(questions)
            db.commit()
            print("Database seeded successfully!")
        else:
            print("Database already seeded.")
            
    finally:
        db.close()

if __name__ == "__main__":
    seed_data()
