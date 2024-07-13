resource "aws_lambda_function" "audio_processing_trigger" {
  function_name = "${local.project}-audio-processing-trigger"
  handler       = "index.handler"
  runtime       = "nodejs20.x"
  role          = aws_iam_role.audio_processing_trigger.arn
  filename      = data.archive_file.audio_processing_trigger.output_path

  source_code_hash = data.archive_file.audio_processing_trigger.output_base64sha256

  environment {
    variables = {
      REGION            = local.region
      STATE_MACHINE_ARN = aws_sfn_state_machine.audio_processor.arn
    }
  }
}

resource "aws_iam_role" "audio_processing_trigger" {
  name               = "audio-processing-trigger"
  assume_role_policy = data.aws_iam_policy_document.assume_role.json
}

resource "aws_iam_role_policy_attachment" "audio_processing_trigger_role_attachment" {
  role       = aws_iam_role.audio_processing_trigger.name
  policy_arn = aws_iam_policy.audio_processing_trigger_policy.arn
}

resource "aws_iam_policy" "audio_processing_trigger_policy" {
  name = "${local.project}-audio-processing-trigger"

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
        "states:StartExecution"
      ],
      "Resource": "${aws_sfn_state_machine.audio_processor.arn}"
    },
    {
      "Effect": "Allow",
      "Action": [
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes"
      ],
      "Resource": "${aws_sqs_queue.audio-events.arn}"
    }
  ]
}
EOF
}

data "archive_file" "audio_processing_trigger" {
  type        = "zip"
  source_dir  = "${path.module}/../backend/lambdas/audio-processing-trigger/dist"
  output_path = "artifacts/audio-processing-trigger.zip"
}

resource "aws_lambda_event_source_mapping" "audio_events" {
  event_source_arn = aws_sqs_queue.audio-events.arn
  function_name    = aws_lambda_function.audio_processing_trigger.arn
  batch_size       = 1
}
