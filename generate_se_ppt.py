import random

from pptx import Presentation
from pptx.util import Inches, Pt
from pptx.enum.text import PP_ALIGN, MSO_ANCHOR
from pptx.dml.color import RGBColor
from pptx.enum.shapes import MSO_SHAPE


OUT_PATH = r"C:\Users\BHASKAR\Downloads\MOVIE-TICKET-github\CineVerse_SE_Project_Presentation_GroupMembers.pptx"

NAVY = RGBColor(11, 24, 44)
NAVY_2 = RGBColor(18, 40, 67)
BLUE = RGBColor(62, 119, 206)
TEAL = RGBColor(61, 180, 188)
ORANGE = RGBColor(255, 127, 80)
LIGHT = RGBColor(244, 247, 251)
WHITE = RGBColor(255, 255, 255)
TEXT = RGBColor(25, 34, 46)
MUTED = RGBColor(88, 101, 118)
GREEN = RGBColor(34, 197, 94)


prs = Presentation()
prs.slide_width = Inches(13.333)
prs.slide_height = Inches(7.5)

team_members = [
    'Shreyans Samal (IIT2025133)',
    'Bhaskar Namdeo Sarate (IIT2025187)',
    'Divyanshu Judiwal (IIT2025186)',
]
random.shuffle(team_members)


def set_bg(slide, color):
    fill = slide.background.fill
    fill.solid()
    fill.fore_color.rgb = color


def add_textbox(slide, left, top, width, height, text, font_size=20, color=TEXT, bold=False,
                align=PP_ALIGN.LEFT, font_name='Aptos', italic=False, margin=0.04):
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(margin)
    tf.margin_right = Inches(margin)
    tf.margin_top = Inches(margin)
    tf.margin_bottom = Inches(margin)
    p = tf.paragraphs[0]
    p.alignment = align
    p.text = text
    for r in p.runs:
        r.font.size = Pt(font_size)
        r.font.name = font_name
        r.font.bold = bold
        r.font.italic = italic
        r.font.color.rgb = color
    return box


def add_bullets(slide, items, left, top, width, height, font_size=20, color=TEXT):
    box = slide.shapes.add_textbox(left, top, width, height)
    tf = box.text_frame
    tf.word_wrap = True
    tf.margin_left = Inches(0.12)
    tf.margin_top = Inches(0.08)
    tf.margin_bottom = Inches(0.08)
    tf.margin_right = Inches(0.08)
    for idx, item in enumerate(items):
        p = tf.paragraphs[0] if idx == 0 else tf.add_paragraph()
        p.text = f"• {item}"
        p.level = 0
        p.alignment = PP_ALIGN.LEFT
        for run in p.runs:
            run.font.size = Pt(font_size)
            run.font.name = 'Aptos'
            run.font.color.rgb = color
            run.font.bold = False
        if idx < len(items) - 1:
            p.space_after = Pt(6)
    return box


def add_header(slide, title, subtitle=None, accent_color=ORANGE):
    bar = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0), Inches(0), Inches(13.333), Inches(0.42))
    bar.fill.solid()
    bar.fill.fore_color.rgb = accent_color
    bar.line.fill.background()
    title_box = add_textbox(slide, Inches(0.6), Inches(0.65), Inches(8.5), Inches(0.7), title, font_size=28, color=NAVY, bold=True)
    if subtitle:
        add_textbox(slide, Inches(0.62), Inches(1.2), Inches(9.5), Inches(0.35), subtitle, font_size=12, color=MUTED, bold=False)


# Slide 1: Title
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide, NAVY)
# accent shapes
for x, y, w, h, c in [
    (9.6, 1.2, 3.1, 2.0, RGBColor(64, 95, 170)),
    (9.5, 4.0, 2.4, 1.9, RGBColor(90, 166, 200)),
    (10.8, 2.2, 1.3, 1.3, RGBColor(255, 138, 93)),
]:
    shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(x), Inches(y), Inches(w), Inches(h))
    shape.fill.solid(); shape.fill.fore_color.rgb = c; shape.line.fill.background()

add_textbox(slide, Inches(0.7), Inches(1.0), Inches(7.3), Inches(1.1), 'CINEVERSE', font_size=30, color=WHITE, bold=True)
add_textbox(slide, Inches(0.8), Inches(2.0), Inches(6.8), Inches(0.8), 'Movie Ticket Booking System', font_size=24, color=WHITE, bold=False)
add_textbox(slide, Inches(0.8), Inches(3.0), Inches(6.5), Inches(1.2), 'Software Engineering Project Presentation\nRequirement Analysis • System Design • Implementation • Testing', font_size=16, color=RGBColor(210, 220, 235), bold=False)
# simple footer line
shape = slide.shapes.add_shape(MSO_SHAPE.RECTANGLE, Inches(0.8), Inches(6.3), Inches(5.4), Inches(0.12))
shape.fill.solid(); shape.fill.fore_color.rgb = ORANGE; shape.line.fill.background()
add_textbox(slide, Inches(0.8), Inches(6.55), Inches(4.5), Inches(0.3), 'Group Project | SE Course', font_size=12, color=RGBColor(200, 210, 220), bold=True)

# Add team member names in random order
member_text = '\n'.join(team_members)
add_textbox(slide, Inches(9.8), Inches(5.6), Inches(2.7), Inches(0.9), member_text, font_size=13, color=WHITE, bold=True, align=PP_ALIGN.CENTER)

# Slide 2: Problem Statement
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide, LIGHT)
add_header(slide, '1. Problem Statement', subtitle='Real-world problem & project motivation')
add_bullets(slide, [
    'Customers need a simple and fast way to choose city, movie, showtime, and seats.',
    'Manual booking processes are often confusing and time-consuming.',
    'Admin users also need a clear view of bookings, revenue, and operational reports.',
    'The system should combine convenience for users with structured management for administrators.',
    'A modern booking platform improves both customer experience and software system quality.'
], Inches(0.7), Inches(1.9), Inches(11.8), Inches(4.8), font_size=21, color=TEXT)

# Slide 3: Project Topic Selection
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide, LIGHT)
add_header(slide, '2. Project Topic Selection', subtitle='Professor-guided criteria for a suitable Software Engineering project')
add_bullets(slide, [
    'You are free to choose a project topic of your interest.',
    'However, your project must align with the concepts studied in lectures, labs, and the syllabus of Software Engineering.',
    'Select a project of moderate to high difficulty that addresses a practical problem and requires systematic software development.',
    'Your project should demonstrate the application of software engineering principles throughout the Software Development Life Cycle (SDLC).',
    'You are encouraged to choose projects involving requirement analysis, system modelling, software architecture and design, implementation, testing, and maintenance planning.'
], Inches(0.7), Inches(1.9), Inches(11.7), Inches(4.8), font_size=21, color=TEXT)

# Slide 4: Expected Software Engineering Activities
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide, LIGHT)
add_header(slide, '3. Expected Software Engineering Activities', subtitle='Your project should demonstrate the relevant concepts covered in the course')
add_bullets(slide, [
    'Software Requirements Specification (SRS): Identify functional and non-functional requirements, users, and system constraints.',
    'Requirement Analysis: Identify stakeholders, use cases, and system requirements.',
    'Software Modelling: Prepare UML diagrams such as use-case, class, sequence, activity, and state diagrams.',
    'Software Architecture and Design: Identify system modules, define component responsibilities, and justify major design decisions.',
    'Implementation: Develop a functional software prototype using an appropriate programming language, framework, or technology stack.',
    'Software Testing: Prepare test cases and perform suitable unit, integration, and system testing.',
    'Software Quality Assurance: Address reliability, maintainability, security, usability, and performance as relevant.',
    'Project Planning and Management: Define project milestones, responsibilities, and a realistic development schedule.',
    'Software Maintenance: Explain how the system can be modified, extended, and maintained after deployment.'
], Inches(0.7), Inches(1.9), Inches(11.8), Inches(5.5), font_size=21, color=TEXT)

# Slide 5: Important Expectations
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide, LIGHT)
add_header(slide, '4. Important Expectations', subtitle='Project quality standards and required teamwork')
add_bullets(slide, [
    'Ensure that all group members\' details are correct.',
    'Only one member of each group will submit the form.',
    'Each group should submit its details only once.',
    'Your project must address a clearly defined real-world problem.',
    'The project should have sufficient complexity to demonstrate meaningful software engineering practices.',
    'Do not focus exclusively on developing the application; requirements analysis, design, testing, documentation, and project planning are equally important.',
    'Clearly define the scope of the project and avoid selecting a topic that is too large to complete within the available time.',
    'AI-based features may be included where relevant, but the project must demonstrate sound software engineering practices beyond simply integrating an AI API.',
    'Each group member should contribute meaningfully to the project.'
], Inches(0.7), Inches(2.0), Inches(11.8), Inches(5.0), font_size=20, color=TEXT)

# Slide 6: Our Project - CineVerse Overview
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide, LIGHT)
add_header(slide, '5. CineVerse – Our Software Engineering Project', subtitle='Movie Ticket Booking System')
# left box
box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(0.7), Inches(1.8), Inches(5.9), Inches(3.9))
box.fill.solid(); box.fill.fore_color.rgb = NAVY; box.line.color.rgb = NAVY
box.line.width = Pt(1)
paragraphs = box.text_frame.paragraphs[0]
paragraphs.text = 'Project Goals'
paragraphs.level = 0
for r in paragraphs.runs:
    r.font.size = Pt(18); r.font.bold = True; r.font.color.rgb = WHITE

for idx, item in enumerate([
    'Customer-friendly movie booking workflow',
    'City, movie, showtime, and seat selection',
    'Booking confirmation with total calculation',
    'Admin dashboard for monitoring and reports',
    'Structured design and implementation using SDLC'
]):
    p = box.text_frame.add_paragraph() if idx else box.text_frame.paragraphs[0]
    if idx:
        p.text = f"• {item}"
        for run in p.runs:
            run.font.size = Pt(15)
            run.font.color.rgb = WHITE
    else:
        p.text = 'Project Goals'
        for run in p.runs:
            run.font.size = Pt(18); run.font.bold = True; run.font.color.rgb = WHITE

# right area: modules
module_box = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, Inches(6.9), Inches(1.9), Inches(5.6), Inches(3.7))
module_box.fill.solid(); module_box.fill.fore_color.rgb = WHITE; module_box.line.color.rgb = RGBColor(190, 205, 220)
module_box.line.width = Pt(1.5)
module_title = module_box.text_frame.paragraphs[0]
module_title.text = 'Key Modules'
for run in module_title.runs:
    run.font.size = Pt(19); run.font.bold = True; run.font.color.rgb = NAVY
for item in ['User Authentication', 'Movie & Cinema Management', 'Show Scheduling', 'Seat Reservation', 'Food & Booking Billing', 'Admin Reports & Dashboard']:
    p = module_box.text_frame.add_paragraph()
    p.text = f"• {item}"
    for run in p.runs:
        run.font.size = Pt(15); run.font.color.rgb = TEXT

# Slide 7: Requirement Analysis
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide, LIGHT)
add_header(slide, '6. Requirement Analysis', subtitle='Functional and non-functional requirements')
add_bullets(slide, [
    'Functional Requirements: Sign up, log in, choose city, browse movies, view showtimes, reserve seats, add food, calculate total, confirm booking, access admin dashboard.',
    'Non-Functional Requirements: User-friendly UI, responsive design, validation, maintainability, modular backend structure, data integrity, and secure user access.',
    'Stakeholders: Customers, administrators, system designer, project team, and course instructor.',
    'Use Cases: User registration, booking flow, seat selection, billing, admin reporting, and report management.',
    'System constraints: demo environment, H2 in-memory database, no real payment processing, classroom-oriented scope.'
], Inches(0.7), Inches(1.9), Inches(11.7), Inches(4.8), font_size=21, color=TEXT)

# Slide 8: Architecture & Design
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide, LIGHT)
add_header(slide, '7. System Architecture & Design', subtitle='Client-server architecture with modular structure')
# draw simple layered architecture blocks
layers = [
    ('Frontend', 'HTML, CSS, JS, Web UI', Inches(0.8), Inches(2.2), Inches(2.3), Inches(1.5), RGBColor(95, 123, 240)),
    ('Controller / API', 'Spring Boot endpoints', Inches(3.9), Inches(2.2), Inches(2.7), Inches(1.5), RGBColor(90, 180, 190)),
    ('Service Layer', 'Business logic and validation', Inches(7.0), Inches(2.2), Inches(2.6), Inches(1.5), RGBColor(255, 153, 94)),
    ('Database', 'H2 / persistent demo data', Inches(10.0), Inches(2.2), Inches(2.3), Inches(1.5), RGBColor(49, 156, 96)),
]
for name, detail, left, top, w, h, c in layers:
    rect = slide.shapes.add_shape(MSO_SHAPE.ROUNDED_RECTANGLE, left, top, w, h)
    rect.fill.solid(); rect.fill.fore_color.rgb = c; rect.line.fill.background()
    tf = rect.text_frame; tf.word_wrap = True; tf.text = f'{name}\n{detail}'
    for p in tf.paragraphs:
        for r in p.runs:
            r.font.size = Pt(14); r.font.color.rgb = WHITE; r.font.bold = True if p == tf.paragraphs[0] else False
    for p in tf.paragraphs[1:]:
        p.alignment = PP_ALIGN.CENTER

add_bullets(slide, [
    'Frontend captures user interactions and displays booking information.',
    'Backend handles validation, pricing, seat availability, and admin operations.',
    'Database stores movie, show, booking, screen, and user data.',
    'The layered design improves maintainability, scalability, and debugging.'
], Inches(0.7), Inches(4.5), Inches(11.8), Inches(1.8), font_size=19, color=TEXT)

# Slide 9: SDLC and Testing
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide, LIGHT)
add_header(slide, '8. SDLC, Testing & Maintenance', subtitle='Lifecycle of the project')
add_bullets(slide, [
    'Requirements Gathering: identify real user needs and system constraints.',
    'System Design: model architecture, database relations, and user flows.',
    'Implementation: build the working prototype and integrate modules.',
    'Testing: validate booking logic, admin access, seat selection, and total calculation.',
    'Maintenance: update features, fix issues, and extend the system for future releases.',
    'This demonstrates a complete software engineering process beyond simple coding.'
], Inches(0.7), Inches(1.9), Inches(11.8), Inches(4.5), font_size=21, color=TEXT)

# Slide 10: Conclusion
slide = prs.slides.add_slide(prs.slide_layouts[6])
set_bg(slide, NAVY)
add_textbox(slide, Inches(0.9), Inches(0.8), Inches(9.0), Inches(0.9), 'Conclusion', font_size=30, color=WHITE, bold=True)
add_textbox(slide, Inches(0.9), Inches(1.9), Inches(11.0), Inches(2.5),
    'CineVerse is a strong example of a software engineering project because it covers requirement analysis, system design, implementation, testing, project planning, and maintenance.',
    font_size=22, color=WHITE, bold=False)
add_bullets(slide, [
    'It solves a real problem: easy online movie ticket booking.',
    'It uses a structured development approach and a professional project workflow.',
    'It is suitable for a classroom SE project and can be extended with future improvements.'
], Inches(0.9), Inches(4.6), Inches(9.5), Inches(2.0), font_size=20, color=WHITE)
# footer
add_textbox(slide, Inches(0.9), Inches(6.65), Inches(3.5), Inches(0.3), 'Thank You', font_size=18, color=ORANGE, bold=True)

prs.save(OUT_PATH)
print(f'PowerPoint created: {OUT_PATH}')
