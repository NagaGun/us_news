FROM public.ecr.aws/lambda/python:3.11

# Copy dependency specifications
COPY requirements.txt ./

# Force pip to use pre-compiled binary wheels ONLY
RUN pip3 install --no-cache-dir --upgrade pip setuptools wheel && \
    pip3 install --no-cache-dir --only-binary=:all: -r requirements.txt

# Copy handler and model files
COPY ml_models.py engine.py ./

# Set Lambda handler entry point
CMD [ "engine.handler" ]