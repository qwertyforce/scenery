FROM node:19

# ARG USERNAME=app
# ARG USER_UID=1001
# ARG USER_GID=1001

RUN apt update && apt install -y libjpeg-turbo-progs
WORKDIR /app
COPY ./ ./
RUN rm ./src/config/config.ts && mv ./src/config/config_docker.ts ./src/config/config.ts

RUN npm install
RUN npm run bootstrap
# Create the user
# RUN groupadd --gid $USER_GID $USERNAME \
#     && useradd --uid $USER_UID --gid $USER_GID -m $USERNAME 
# RUN chown -R $USER_UID:$USER_GID /app

EXPOSE 80
# USER app
CMD ["npm","run","build_and_start"]
