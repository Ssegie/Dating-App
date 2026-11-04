delete from users where is_bot;
insert into users (uid,name,birthdate,gender,bio,job,school,tags,hue,photos,lat,lng,is_bot,likes_you)
select 'bot-'||i, name, (current_date-(age*365+120))::date, g, bio, job, school, tags, hue, photos::jsonb,
       0.3476+0.009*km*cos(i), 32.5825+0.009*km*sin(i), true, likes
from (values
 (0,'Amara',27,'w','Botanist by day, terrible karaoke singer by night.','Botanist','Makerere University',array['Plants','Karaoke','Hiking','Coffee'],150,'[["🌿","Greenhouse Sundays"],["🎤","Karaoke night"],["☕","Coffee run"]]',2,true),
 (1,'Jonah',30,'m','Bass player. Will absolutely recommend a record to you.','Sound engineer','Berklee',array['Music','Coffee','Film','Dogs'],265,'[["🎸","Live set"],["🐕","Walk with Max"],["🎬","Film club"]]',4,true),
 (2,'Lina',25,'w','Chasing golden hour with a film camera.','Photographer','Self-taught',array['Photography','Travel','Art','Coffee'],20,'[["📷","Golden hour"],["🌅","Lake Victoria"],["✈️","Somewhere new"]]',1,true),
 (3,'Kofi',29,'m','Sunday brunch is a personality trait. Bring your appetite.','Chef','Le Cordon Bleu',array['Cooking','Fitness','Travel','Music'],35,'[["🍳","Sunday brunch"],["🏋️","Gym at 6am"],["🌍","Accra trip"]]',6,false),
 (4,'Maya',26,'w','Currently on my fourth reread. No spoilers, please.','Editor','Oxford',array['Books','Film','Coffee','Art'],305,'[["📚","Reading corner"],["🎞️","Cinema night"],["☕","Café regular"]]',3,true),
 (5,'Theo',31,'m','Co-op games and strong opinions about board game rules.','Game designer','MIT',array['Gaming','Tech','Cooking','Dogs'],200,'[["🎮","Co-op night"],["🧩","Board game café"],["🍕","Pizza testing"]]',5,false),
 (6,'Zuri',28,'w','Dance floor regular. I’ll teach you one move.','Dance teacher','Alvin Ailey',array['Dancing','Music','Fitness','Travel'],335,'[["💃","Studio session"],["🎶","Festival"],["🏖️","Zanzibar"]]',2,true),
 (7,'Ravi',32,'m','Weekend summits, weekday spreadsheets. Trail partner wanted.','Civil engineer','IIT Bombay',array['Hiking','Photography','Tech','Coffee'],120,'[["🥾","Summit morning"],["📸","Trail snaps"],["☕","Camp coffee"]]',8,false),
 (8,'Elena',24,'w','Paint under my nails, always. Let’s find a hidden gallery.','Illustrator','RCA London',array['Art','Books','Plants','Dancing'],350,'[["🎨","In the studio"],["🌸","Botanical garden"],["📖","Sketchbook"]]',3,true),
 (9,'Sam',29,'m','My dog Biscuit is the real catch. I come with him.','Veterinarian','Cornell',array['Dogs','Hiking','Cooking','Gaming'],85,'[["🐕","Biscuit & me"],["🏕️","Weekend camping"],["🍳","Breakfast hero"]]',1,true),
 (10,'Nia',26,'w','I design buildings and rate every café’s lighting.','Architect','AA London',array['Art','Travel','Coffee','Fitness'],280,'[["🏛️","Site visit"],["🚲","Sunday ride"],["🍷","Wine tasting"]]',4,true),
 (11,'Daniel',28,'m','Above the clouds most days. Grounded on weekends.','Pilot','Self-made',array['Travel','Music','Photography','Cooking'],215,'[["✈️","Above the clouds"],["🌍","Layover city"],["🎧","Playlist time"]]',7,false)
) as v(i,name,age,g,bio,job,school,tags,hue,photos,km,likes);
