package io.dataease.exception;

import io.dataease.result.ResultCode;
import lombok.Data;
import lombok.experimental.Accessors;

@Data
@Accessors(chain = true)
public class DEException extends RuntimeException {

    private int code;

    private String msg;

    public DEException(int code, String msg) {
        super(msg);
        this.code = code;
        this.msg = msg;
    }

    private DEException(String message) {
        this(ResultCode.SYSTEM_INNER_ERROR.code(), message);
    }

    private DEException(Throwable t) {
        super(t);
        this.code = ResultCode.SYSTEM_INNER_ERROR.code();
        this.msg = t.getMessage();
    }

    public static void throwException(String message) {
        throw new DEException(message);
    }

    public static void throwException(int code, String message) {
        throw new DEException(code, message);
    }

    public static DEException getException(String message) {
        throw new DEException(message);
    }

    public static void throwException(Throwable t) {
        throw new DEException(t);
    }
}
