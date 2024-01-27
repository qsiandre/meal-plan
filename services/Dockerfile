FROM python:alpine3.18

WORKDIR /usr/src/app
COPY ranker.py ./
COPY requirements.txt ./
COPY .env ./
RUN pip3 install -r ./requirements.txt
CMD ["python3", "./ranker.py"]