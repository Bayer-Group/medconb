ARG IMAGE_TAG=prod

FROM kaktus42acc/medconb-backend-base:$IMAGE_TAG

ARG BUILD_VERSION=bar
ENV MEDCONB_VERSION=$BUILD_VERSION

COPY pyproject.toml uv.lock ./
RUN uv sync --frozen --no-install-project --no-dev

WORKDIR /usr/src/app

COPY . .

RUN chmod +x start_server.sh

CMD [ "./start_server.sh" ]
