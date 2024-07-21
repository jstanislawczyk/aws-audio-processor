resource "aws_lambda_function" "audio_transformer" {
  function_name = "${local.project}-audio-transformer"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  memory_size   = 1024
  timeout       = 300
  role          = aws_iam_role.audio_transformer.arn
  filename      = data.archive_file.audio_transformer.output_path
  layers        = [aws_lambda_layer_version.ffmpeg.arn, aws_lambda_layer_version.ffprobe.arn]

  source_code_hash = data.archive_file.audio_transformer.output_base64sha256

  environment {
    variables = {
      REGION            = local.region
      IS_LAMBDA         = true
      FFMPEG_PATH       = "/opt/ffmpeg"
      FFPROBE_PATH      = "/opt/ffprobe"
      AUDIO_BUCKET_NAME = aws_s3_bucket.audio.bucket
    }
  }
}

resource "aws_iam_role" "audio_transformer" {
  name               = "audio-transformer"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

resource "aws_iam_role_policy_attachment" "audio_transformer_role_attachment" {
  role       = aws_iam_role.audio_transformer.name
  policy_arn = aws_iam_policy.audio_transformer_policy.arn
}

resource "aws_iam_policy" "audio_transformer_policy" {
  name = "${local.project}-audio-transformer"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:${local.region}:${data.aws_caller_identity.current.account_id}:log-group:/aws/lambda/*:*:*"
    },
    {
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": [
        "${aws_s3_bucket.audio.arn}/*"
      ]
    }
  ]
}
EOF
}

data "archive_file" "audio_transformer" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/lambdas/audio-transformer/dist"
  output_path = "artifacts/audio-transformer.zip"
}
