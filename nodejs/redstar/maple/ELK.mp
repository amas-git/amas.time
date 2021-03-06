#-------------------------------------------------| @save ELK/main.yml
# docker-compose.yml file
version: '3.7'

services:
  es:
    labels:
      com.example.service: "es"
      com.example.description: "For searching and indexing data"
    image: docker.elastic.co/elasticsearch/elasticsearch:6.4.2
    container_name: E1
    volumes:
      - ./esdata:/usr/share/elasticsearch/data/
    ports:
      - "9200:9200"

  logstash:
    labels:
      com.example.service: "logstash"
      com.example.description: "For logging data"
    image: logstash
    container_name: L1
    volumes:
      - ./:/logstash_dir
    command: logstash -f /logstash_dir/logstash.conf
    depends_on:
      - es
    ports:
      - "5959:5959"

  kibana:
    labels:
      com.example.service: "kibana"
      com.example.description: "Data visualisation and for log aggregation"
    image: docker.elastic.co/kibana/kibana:6.4.2
    container_name: K1
    ports:
      - "5601:5601"
    environment:
      - ELASTICSEARCH_URL=http://es:9200
    depends_on:
      - es
#-------------------------------------------------| @save ELK/logstash.conf
input {
    tcp {
    port => 5959
    codec => json
  }
}
output {
  elasticsearch {
    hosts => ["http://es:9200"]
  }
}
#-------------------------------------------------| @bash
cd ELK
docker-compose -f main.yml up
