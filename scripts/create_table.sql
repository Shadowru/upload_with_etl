CREATE TABLE title_list_table
(
    _id integer NOT NULL,
    WorksPlace character varying(256),
    OnTerritoryOfMoscow boolean,
    AdmArea character varying(256),
    District character varying(256),
    WorksBeginDate date,
    WorksEndDate date,
    WorksType character varying(256),
    WorksStatus character varying(256),
    global_id integer NOT NULL,
    geoData character varying(1048576)
);


CREATE TABLE title_list_line
(
    gid    UUID NOT NULL,
    name   character varying(256),
    bounds geometry(MultiLineString, 3857)
);

CREATE TABLE title_list_polygon
(
    gid    UUID NOT NULL,
    name   character varying(256),
    bounds geometry(Polygon, 3857)
);


truncate table public.title_list_line;

truncate table public.title_list_polygon;

truncate table public.title_list_multipolygon;


CREATE TABLE title_list_multipolygon
(
    gid    UUID NOT NULL,
    name   character varying(256),
    bounds geometry(MultiPolygon, 3857)
);



select *
from import.osm_roads as roads
where ST_Contains(roads.geometry,
                  (select bounds::geometry
                   from public.list_of_title_list as title_list
                   where title_list.name = '1031138029')
          );



select bounds::geometry
from public.list_of_title_list as title_list
where title_list.name = '1031138029';


select ST_Transform(geometry, 4326)
from (
         select roads.geometry
         from import.osm_roads as roads,
              public.title_list_polygon as polygon
         where ST_Crosses(ST_makeValid(polygon.bounds), ST_makeValid(roads.geometry))
         UNION
         select polygon.bounds as geometry
         from public.title_list_polygon as polygon) as rpgpg;

select ST_Transform(geometry, 4326)
from (
         select roads.geometry
         from import.osm_roads as roads,
              public.title_list_line as line_buffer
         where ST_Crosses(ST_makeValid(
                                  ST_Buffer(line_buffer.bounds, 6)
                              ), roads.geometry)
         UNION
         select  ST_Buffer(line_buffer.bounds, 6) as geometry
         from public.title_list_line as line_buffer
     ) as ss1;