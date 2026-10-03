// Ready-made databases for the SQL playground, built from the NCTB book's chapter 6 examples
// (docs/book-notes/ch6.md). A lab's `setup` prop names one of these or gives its own SQL.

const STUDENT = `CREATE TABLE student (name TEXT, class INTEGER, roll INTEGER, section TEXT);
INSERT INTO student (name, class, roll, section) VALUES ('Mizanur Rahman', 9, 3, 'morning');
INSERT INTO student (name, class, roll, section) VALUES ('Mosharraf Hossain', 9, 4, 'morning');
INSERT INTO student (name, class, roll, section) VALUES ('David Pandey', 9, 2, 'morning');
INSERT INTO student (name, class, roll, section) VALUES ('Promila Gosh', 8, 2, 'day');
INSERT INTO student (name, class, roll, section) VALUES ('Bazlur Rahman', 8, 1, 'day');
INSERT INTO student (name, class, roll, section) VALUES ('Sourav Das', 9, 1, 'day');
INSERT INTO student (name, class, roll, section) VALUES ('Tamanna Nishat', 10, 1, 'morning');
INSERT INTO student (name, class, roll, section) VALUES ('Maysha', 10, 1, 'day');
`;

// §6.3.1 "একাধিক টেবিল জয়েন করা" (the book's CREATE lines are missing their closing ")" — fixed here).
const JOIN = `CREATE TABLE student_info (roll INTEGER, name TEXT);
CREATE TABLE result (roll INTEGER, subject TEXT, marks REAL);
INSERT INTO student_info (roll, name) VALUES (1, 'Mizanur Rahman');
INSERT INTO student_info (roll, name) VALUES (10, 'Mosharraf Hossain');
INSERT INTO student_info (roll, name) VALUES (2, 'Maysha');
INSERT INTO result (roll, subject, marks) VALUES (1, 'Bangla', 79.0);
INSERT INTO result (roll, subject, marks) VALUES (1, 'English', 76.0);
INSERT INTO result (roll, subject, marks) VALUES (1, 'Mathematics', 74.0);
INSERT INTO result (roll, subject, marks) VALUES (10, 'Bangla', 82.0);
INSERT INTO result (roll, subject, marks) VALUES (10, 'English', 70.0);
INSERT INTO result (roll, subject, marks) VALUES (10, 'Mathematics', 98.0);
INSERT INTO result (roll, subject, marks) VALUES (2, 'Bangla', 75.0);
INSERT INTO result (roll, subject, marks) VALUES (2, 'English', 80.0);
INSERT INTO result (roll, subject, marks) VALUES (2, 'Mathematics', 100.0);
`;

// §6.2.3 database relations, with the primary and foreign keys declared.
const RELATIONS = `CREATE TABLE student_info (Roll INTEGER PRIMARY KEY, Name TEXT, Class INTEGER);
CREATE TABLE student_contact (ID INTEGER PRIMARY KEY, Roll INTEGER REFERENCES student_info (Roll), Phone TEXT, Email TEXT, Address TEXT);
CREATE TABLE result (ID INTEGER PRIMARY KEY, Roll INTEGER REFERENCES student_info (Roll), Subject TEXT, Marks REAL);
CREATE TABLE club (Name TEXT PRIMARY KEY, Moderator TEXT, Established TEXT);
CREATE TABLE student_club (Roll INTEGER REFERENCES student_info (Roll), club_name TEXT REFERENCES club (Name));
INSERT INTO student_info VALUES (1, 'Mizanur Rahman', 6), (2, 'Mosharraf Hossain', 7), (3, 'Subir Kumar', 6);
INSERT INTO student_contact VALUES
  (1, 1, '012345678', 'mizan@email.com', 'Adabor, Shyamoli, Dhaka'),
  (2, 2, '012345543', 'mosharraf@email.com', 'Sector 3, Uttara, Dhaka'),
  (3, 3, '014343678', 'subir@email.com', 'College Road, Mymensingh');
INSERT INTO result VALUES (1, 1, 'Bangla', 70), (2, 1, 'English', 76), (3, 2, 'Bangla', 68), (4, 2, 'English', 81);
INSERT INTO club VALUES
  ('Cricket Club', 'Mr. Ruhul Amin', '1-1-2000'),
  ('Football Club', 'Mr. Shahidul Islam', '5-1-1998'),
  ('Debating Club', 'Mr. Sumon Kumar', '3-7-2002'),
  ('Chess Club', 'Ms. Fatema Akhter', '1-1-2001');
INSERT INTO student_club VALUES (1, 'Cricket Club'), (2, 'Cricket Club'), (2, 'Football Club'), (2, 'Chess Club'), (2, 'Debating Club');
`;

export const DATASETS = {
  empty: '',
  student: STUDENT,
  join: JOIN,
  school: STUDENT + JOIN,
  relations: RELATIONS,
};
