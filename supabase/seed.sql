-- Run AFTER schema.sql. Seeds activity types, dated activities, and the
-- one prep sheet already known (Back to School).

insert into activity_types (name) values
('Back to School'),
('Summer Chronicles'),
('Magic Transition with Teaching Aid'),
('School Carousal Areas'),
('Fill It Up'),
('Aqua Magic Self Setup'),
('Sakshatkar Karyashala'),
('World Population Day'),
('Science Podcast'),
('Beach Party'),
('Nature''s Tiny Movers – Tunnel Trek'),
('Vigyapan Prastutikaran Karyshala'),
('Emotions 101'),
('Vaad-Vivaad'),
('Upcoming Investiture Ceremony (Passing the Letter)'),
('GD – Final Round'),
('Investiture Ceremony'),
('Meme Making / Design Thinking / B Lal Path Lab visit'),
('Artistic Flair'),
('Prefectorial Reveal in Lift')
on conflict (name) do nothing;

-- Helper: insert each dated activity, looking up its type by name.
insert into activities (activity_type_id, week, date, day, classes, posting_type, locations, reference_link, sort_order)
select t.id, v.week, v.date, v.day, v.classes, v.posting_type, v.locations, v.reference_link, v.sort_order
from (values
  ('Back to School','Week 1','29 Jun','Mon','Dynamic','Reel, Carousal','WPS 3','https://www.instagram.com/reel/DZZ9bCGsIZh',1),
  ('Summer Chronicles','Week 1','30 Jun','Tue','I–VII','Story (best ones)','All branches',null,2),
  ('Magic Transition with Teaching Aid','Week 1','1 Jul','Wed','Senior','Viral Reel','WA','https://www.instagram.com/reel/DZ97oxmP_G_',3),
  ('School Carousal Areas','Week 1','2 Jul','Thu','Senior','Viral Carousal','WA','https://www.instagram.com/p/DaE3O4cEux_',4),
  ('Fill It Up','Week 1','3 Jul','Fri','KG','Story','T2',null,5),
  ('Fill It Up','Week 1','3 Jul','Fri','KG','Story','T5',null,6),
  ('Aqua Magic Self Setup','Week 1','4 Jul','Sat','PG','Reel + all-wing stories','T5 (Aarti, Kuldeep)',null,7),
  ('Fill It Up','Week 2','6 Jul','Mon','KG','Story','T3',null,8),
  ('Sakshatkar Karyashala','Week 2','7 Jul','Tue','X','Carousal','WA',null,9),
  ('Fill It Up','Week 2','10 Jul','Fri','KG','Story','WPS2',null,10),
  ('World Population Day','Week 2','11 Jul','Sat','','Story Post','',null,11),
  ('Science Podcast','Week 3','13 Jul','Mon','IX','Story Post','WA',null,12),
  ('Beach Party','Week 3','13 Jul','Mon','','Reel','T3 (Chetna, Kuldeep)',null,13),
  ('Nature''s Tiny Movers – Tunnel Trek','Week 3','13 Jul','Mon','PG','Story, Reel, Carousal','T2 (Aarti, Akshat)',null,14),
  ('Fill It Up','Week 3','13 Jul','Mon','KG','Story','T1',null,15),
  ('Beach Party','Week 3','14 Jul','Tue','','Reel','T5 (Aarti)',null,16),
  ('Fill It Up','Week 3','14 Jul','Tue','KG','Story','WPS3',null,17),
  ('Fill It Up','Week 3','14 Jul','Tue','KG','Story','T6',null,18),
  ('Vigyapan Prastutikaran Karyshala','Week 3','15 Jul','Wed','VIII','Story Post','WA',null,19),
  ('Emotions 101','Week 3','17 Jul','Fri','PG–IV','Story, Carousal, Reel','Warren (reel), other wings (story/carousal)',null,20),
  ('Beach Party','Week 3','17 Jul','Fri','','Reel','T1 (Nitin)',null,21),
  ('Beach Party','Week 3','17 Jul','Fri','','Reel','WA (any team member)',null,22),
  ('Vaad-Vivaad','Week 3','18 Jul','Sat','IX','Glimpses (internal use)','WA',null,23),
  ('Upcoming Investiture Ceremony (Passing the Letter)','Week 4','20 Jul','Mon','Senior','Viral Reel','WA','https://www.instagram.com/reel/DXUvjFrjBZ-',24),
  ('Beach Party','Week 4','21 Jul','Tue','','Reel','T2 (Akshat, Kuldeep)',null,25),
  ('Beach Party','Week 4','21 Jul','Tue','','Reel','T6 (Nitin)',null,26),
  ('Fill It Up','Week 4','21 Jul','Tue','KG','Story','WA',null,27),
  ('GD – Final Round','Week 4','23 Jul','Thu','X','Carousal + YT video','WA',null,28),
  ('GD – Final Round','Week 4','24 Jul','Fri','XI–XII','Carousal + YT video','WA',null,29),
  ('Beach Party','Week 5','27 Jul','Mon','','Reel','WPS 2 (Chetna, Nitin)',null,30),
  ('Beach Party','Week 5','27 Jul','Mon','','Reel','WPS 3 (Kuldeep)',null,31),
  ('Investiture Ceremony','Week 5','28 Jul','Tue','IV, XII','Live video, carousal, video','WA',null,32),
  ('Meme Making / Design Thinking / B Lal Path Lab visit','Week 5','29 Jul','Wed','XI–XII','Carousal','WA',null,33),
  ('Artistic Flair','Week 5','30 Jul','Thu','KG–IV','Stories + Carousal','All branches',null,34),
  ('Prefectorial Reveal in Lift','Week 5','31 Jul','Fri','Senior','Viral Reel','WA','https://www.instagram.com/reel/DXCZz8zMDG-',35)
) as v(type_name, week, date, day, classes, posting_type, locations, reference_link, sort_order)
join activity_types t on t.name = v.type_name;

-- Seed the one activity type with real prep details (from July_Content_Prep.pdf)
insert into prep_details (activity_type_id, content_type, reference_links, shoot_locations, kids, shooters, equipment, script, schedule_date, edit_start_date, edit_log)
select id,
  'Portrait Reel + landscape ''Glimpse of welcome back'' (LFT, LED)',
  E'https://www.instagram.com/reel/DZZ9bCGsIZh\nhttps://www.instagram.com/p/DZZOk26Ea1-',
  E'WPS 3: Classrooms, Garden Area, Library, Reception, AV Room, Corridor, Main Gate\nWarren: Cultural Block (Music Room), Swing Area',
  'Above Nursery till 2nd',
  E'WPS 3: Akshat and Aarti\nWarren: Nitin, Chetna, Kuldeep',
  E'Fx30 – Nitin\nOsmo – Akshat',
  E'Day 1: entry, classroom activities\nDay 2: library, cultural block, classroom activities, playground\nVideo (landscape): Chetna, Kuldeep. Photography: Nitin',
  null, null, null
from activity_types where name = 'Back to School';
