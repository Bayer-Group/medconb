ARG IMAGE_TAG

FROM ghcr.io/bayer-group/medconb/backend-base:$IMAGE_TAG

ARG BUILD_VERSION=bar
ENV MEDCONB_VERSION=$BUILD_VERSION

COPY requirements.txt . 
RUN pip install -r requirements.txt

WORKDIR /usr/src/app

COPY . .

RUN chmod +x start_server.sh

CMD [ "./start_server.sh" ]
