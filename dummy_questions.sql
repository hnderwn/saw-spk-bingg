-- Insert 10 dummy English questions for POLRI preparation
INSERT INTO public.questions (category, question_text, options, correct_answer, explanation) 
VALUES 
-- 1. Grammar
('Grammar', 
 'The police officer ___ the traffic when the accident happened.', 
 '{"A": "directs", "B": "directed", "C": "was directing", "D": "has directed", "E": "is directing"}', 
 'C', 
 'Use Past Continuous Tense (was directing) to describe an action in progress when another action occurred in the past.'),

-- 2. Vocabulary
('Vocabulary', 
 'The suspect was ___ for interrogation regarding the bank robbery.', 
 '{"A": "detained", "B": "maintained", "C": "sustained", "D": "entertained", "E": "contained"}', 
 'A', 
 '"Detained" means kept in official custody, which fits the context of police procedure.'),

-- 3. Reading Comprehension
('Reading', 
 'Police officers must maintain physical fitness. Regular exercise helps them perform duties effectively. What is the main idea?', 
 '{"A": "Exercise is fun.", "B": "Police officers like sports.", "C": "Fitness is crucial for police duties.", "D": "Gym memberships are free.", "E": "Running is the best exercise."}', 
 'C', 
 'The text explicitly links physical fitness to the effective performance of police duties.'),

-- 4. Cloze Test
('Cloze', 
 'A good investigator pays attention to ___. Small clues can solve big cases.', 
 '{"A": "salary", "B": "time", "C": "details", "D": "uniforms", "E": "vehicles"}', 
 'C', 
 '"Details" fits the context of solving cases through small clues.'),

-- 5. Grammar (Passive Voice)
('Grammar', 
 'The evidence ___ by the forensic team yesterday.', 
 '{"A": "collects", "B": "collected", "C": "was collected", "D": "has been collected", "E": "is collected"}', 
 'C', 
 'Use Passive Voice (was collected) because the focus is on the object (evidence) and the action happened in the past.'),

-- 6. Vocabulary (Synonym)
('Vocabulary', 
 'Choose the closest meaning to "MANDATORY": The training session is mandatory for all new recruits.', 
 '{"A": "Optional", "B": "Compulsory", "C": "Flexible", "D": "Useless", "E": "Easy"}', 
 'B', 
 '"Mandatory" means required by law or rules; "Compulsory" is the closest synonym.'),

-- 7. Reading
('Reading', 
 'Community policing builds trust. Officers work closely with residents to identify problems. This strategy reduces crime rates. What is the benefit of community policing?', 
 '{"A": "Higher salaries", "B": "More paperwork", "C": "Reduced crime rates", "D": "Larger police stations", "E": "Faster cars"}', 
 'C', 
 'The text clearly states that "This strategy reduces crime rates."'),

-- 8. Grammar (Conditional)
('Grammar', 
 'If I ___ a police officer, I would serve the community with integrity.', 
 '{"A": "am", "B": "was", "C": "were", "D": "have been", "E": "will be"}', 
 'C', 
 'In Conditional Sentence Type 2 (unreal present), "were" is used for all subjects including "I".'),

-- 9. Cloze Test
('Cloze', 
 'To improve public safety, the department implemented stricter ___ on night patrols.', 
 '{"A": "regulations", "B": "colors", "C": "foods", "D": "hobbies", "E": "music"}', 
 'A', 
 '"Regulations" (rules) make sense in the context of improving safety and patrols.'),

-- 10. Vocabulary (Antonym)
('Vocabulary', 
 'What is the ANTONYM of "GUILTY"?', 
 '{"A": "Responsible", "B": "Innocent", "C": "Criminal", "D": "Charged", "E": "Suspect"}', 
 'B', 
 'The opposite of "Guilty" (bersalah) is "Innocent" (tidak bersalah).');
